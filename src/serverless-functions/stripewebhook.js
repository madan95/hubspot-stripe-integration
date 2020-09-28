// Listent to stripe payment sucess intent webhook and update hubspot db with payment status.
exports.main = (context, sendResponse) => {
    let event = context.body;

    let intent = null;
    let message = 'Intent found.';
    switch (event['type']) {
        case 'payment_intent.succeeded':
            intent = event.data.object;
            message = 'Payment sucessfull.';
            break;
        case 'payment_intent.payment_failed':
            intent = event.data.object;
            message = intent.last_payment_error && intent.last_payment_error.message;
            break;
    }

    sendResponse({ body: { message: message }, statusCode: 200 });
};