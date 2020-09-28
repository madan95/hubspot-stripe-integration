const utils = require('./utils');
const PRODUCT_ORDER_TABLE_NAME = 'product_order'

// Listent to stripe payment sucess intent webhook and update hubspot db with payment status.
exports.main = (context, sendResponse) => {
    let event = context.body;
    const order_id = event.data.object.metadata.order_id;

    let intent = null;
    let message = 'Intent found.';
    switch (event['type']) {
        case 'payment_intent.succeeded':
            intent = event.data.object;
            message = `Payment sucessfull for product/order_id ${order_id}`;
            utils.updateColumnValue(PRODUCT_ORDER_TABLE_NAME, 'status', order_id, 'PAID')
                .catch(err => {
                    // Log error.
                })
            break;
        case 'payment_intent.payment_failed':
            intent = event.data.object;
            message = intent.last_payment_error && intent.last_payment_error.message;
            break;
    }

    sendResponse({ body: { message: message }, statusCode: 200 });
};