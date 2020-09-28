const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CURRENCY = 'gbp';

const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Create payment intent in stripe and return the client secret for payment.
exports.main = (context, sendResponse) => {

    const contact_id = context.contact.vid;
    const price = 1000;
    const order_id = 1;

    stripe.paymentIntents.create({
        amount: price * 100,
        currency: STRIPE_CURRENCY,
        statement_descriptor: 'Stateme descriptor',
        metadata: {
            integration_check: 'accept_a_payment',
            hubspot_contact_vid: contact_id,
            order_id: order_id,
        }
    }).then(intent => {
        sendResponse({ body: { type: 'success', client_secret: intent.client_secret }, statusCode: 200 })
    }).catch(err => {
        const message = 'Failed getting client secret'
        sendResponse({
            body: {
                type: 'error',
                message: message,
                details: err.message ? err.message : message,
                temp: err
            }, statusCode: 403
        })
    });
};