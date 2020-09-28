'use strict';

document.addEventListener("DOMContentLoaded", function () {
    const STRIPE_PUBLIC_KEY = 'xxxx';
    const PAYMENT_COMPONENT = 'custom-payment';
    const STRIPE_ELEMENT_MODIFIER_CLASSES = {
        focus: `focused`,
        empty: `empty`,
        invalid: `invalid`,
    };
    const STRIPE_ELEMENT_STYLES = {
        base: {
            fontSmoothing: 'antialiased',

            '::placeholder': {
                color: '#CFD7DF',
            },
            ':-webkit-autofill': {
                color: '#e39f48',
            },
        },
        invalid: {
            color: '#E25950',

            '::placeholder': {
                color: '#FFCCA5',
            },
        },
    };

    // Request serverless/stripe api for client secret.
    const getClientSecret = (order_id) => {
        return fetch('/_hcms/api/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: order_id,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.client_secret) {
                    return data.client_secret;
                }
                throw new Error({ name: "client_secret_not_found", message: "Failed retriving client secret." });
            });
    };

    // Add custom modifier class for input elements.
    const setInputElementModifier = () => {
        const inputs = document.querySelectorAll(`.${PAYMENT_COMPONENT} .input`);

        Array.prototype.forEach.call(inputs, function (input) {
            input.addEventListener('focus', function () {
                input.classList.add(`${STRIPE_ELEMENT_MODIFIER_CLASSES.focus}`);
            });
            input.addEventListener('blur', function () {
                input.classList.remove(`${STRIPE_ELEMENT_MODIFIER_CLASSES.focus}`);
            });
            input.addEventListener('keyup', function () {
                if (input.value.length === 0) {
                    input.classList.add(`${STRIPE_ELEMENT_MODIFIER_CLASSES.empty}`);
                } else {
                    input.classList.remove(`${STRIPE_ELEMENT_MODIFIER_CLASSES.empty}`);
                }
            });
        });
    }

    // Add error listener for input fields & show error messages.
    const setFieldErrorListener = (elements) => {
        let savedErrors = {};
        const form = document.getElementById(`${PAYMENT_COMPONENT}__form`);
        const error_element = form.querySelector(`.${PAYMENT_COMPONENT} .error`);
        const error_message_element = error_element.querySelector(`.${PAYMENT_COMPONENT} .message`);
        elements.forEach((element, idx) => {
            element.on('change', (event) => {
                if (event.error) {
                    error_element.classList.add('visible');
                    savedErrors[idx] = event.error.message;
                    error_message_element.innerText = event.error.message;
                } else {
                    savedErrors[idx] = null;
                    let nextError = Object.keys(savedErrors)
                        .sort()
                        .reduce((maybeFoundError, key) => {
                            return maybeFoundError || savedErrors[key];
                        }, null);
                    if (nextError) {
                        error_message_element.innerText = nextError;
                    } else {
                        error_element.classList.remove('visible');
                    }
                }
            });
        });
    }

    // Listen to form submit & handle.
    const setFormSubmitListener = (stripe, cardNumber, client_secret) => {
        const form = document.getElementById(`${PAYMENT_COMPONENT}__form`);
        const enableInputs = () => {
            Array.prototype.forEach.call(form.querySelectorAll("input[type='text']"), (input) => { input.removeAttribute('disabled'); });
        };
        const disableInputs = () => {
            Array.prototype.forEach.call(form.querySelectorAll("input[type='text']"), (input) => { input.setAttribute('disabled', 'true'); });
        };

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            disableInputs();
            const name = 'Test payment';
            const address = form.querySelector(`#${PAYMENT_COMPONENT}__card-address`);
            const zip = form.querySelector(`#${PAYMENT_COMPONENT}__card-postcode`);

            stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: cardNumber,
                    billing_details: {
                        name: name ? name : undefined,
                        address: {
                            line1: address ? address.value : undefined,
                            postal_code: zip ? zip.value : undefined
                        }
                    }
                }
            }).then(function (res) {
                if (res.error) {
                    enableInputs();
                    throw new Error({ name: res.error.type, message: res.error.message })
                } else {
                    if (res.paymentIntent.status === 'succeeded') {
                        enableInputs();
                        alert('Order payment sucessfull.');
                    }
                }
            })
        });
    }

    const buildFrontend = (client_secret, order_id) => {
        const stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements();

        const cardNumber = elements.create('cardNumber', {
            style: STRIPE_ELEMENT_STYLES,
            classes: STRIPE_ELEMENT_MODIFIER_CLASSES,
        });
        const cardExpiry = elements.create('cardExpiry', {
            style: STRIPE_ELEMENT_STYLES,
            classes: STRIPE_ELEMENT_MODIFIER_CLASSES,
        });
        const cardCvc = elements.create('cardCvc', {
            style: STRIPE_ELEMENT_STYLES,
            classes: STRIPE_ELEMENT_MODIFIER_CLASSES,
        });

        cardNumber.mount('#custom-payment__card-number');
        cardExpiry.mount('#custom-payment__card-expiry');
        cardCvc.mount('#custom-payment__card-cvc');

        setInputElementModifier();
        setFieldErrorListener([cardNumber, cardExpiry, cardCvc]);
        setFormSubmitListener(stripe, cardNumber, client_secret);
    }

    const setErrorMessageForPaymentPage = () => {
        const error_message_element = document.querySelector(`.${PAYMENT_COMPONENT} .message`);
        const error_element = document.querySelector(`.${PAYMENT_COMPONENT} .error`);
        error_message_element.innerText = "An error occured in the page, please refresh the page.";
        error_message_element.classList.add('visible');
        error_element.classList.add('visible');
    }

    const setupPayment = () => {
        const order_id = 1;

        if (order_id) {
            getClientSecret(order_id)
                .then(client_secret => {
                    buildFrontend(client_secret, order_id);
                }).catch(err => {
                    console.log("found error in promise.");
                    console.log(err);
                    setErrorMessageForPaymentPage();
                });
        }
        else {
            throw new Error({ name: 'missing_order_id', message: 'order_id not found.' });
        }
    }

    setupPayment();
});