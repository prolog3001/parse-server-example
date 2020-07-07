const axios = require('axios').default;
const utils = require('./utils');

const MERCHANT_FEE = process.env.MERCHANT_FEE_PERC

var PAYMENT_CLASS_NAME = 'Payment';
var PAYMENT_FIELD_NAME = 'payment';

module.exports = {
    purchaseProduct: function (request, response) {
        purchaseProduct(request, response);
    },
    refundProduct: function (request, response) {
        refundProduct(request, response);
    }
};

//productType 0-FREE_AMOUNT, 1-ORDER
async function purchaseProduct(request, response) {
    console.log('purchaseProduct');
    console.log('params', request.params);
    let { businessId, productType, clientId, productId, amount} = request.params;

    let client = await utils.getObjectById('User', clientId);
    var product;
    var business;

    switch (parseInt(productType)) {
        case 0://Free AMount
            business = await utils.getObjectById('Business', businessId);
            break;
        case 1://Order
            product = await utils.getObjectById('RestaurantOrderSummary', productId);
            business = await utils.getObjectById('Business', product.get('business').id);
            break;
        default:
            break;
    }

    let isSellerPaidDirectly = await sellerPaidDirectly(owner);

    var locale = business.get('language');
    locale = locale ? (locale.includes('he') ? 'he' : 'en') : 'en';

    let amountToPay = Math.floor(amount * 100);

    let buyerKey = client.get('payme_buyer_key');
    let isBuyerKeyValid = !utils.isEmpty(buyerKey);
    console.log('buyerKey', buyerKey);
    console.log('isBuyerKeyValid', isBuyerKeyValid);

    params = {
        seller_payme_id: business.get('payme_seller_id'),
        sale_price: amountToPay.toString(),

        ...(!isSellerPaidDirectly && {
            market_fee: (userPreferences.get("merchant_fee_percent") ? userPreferences.get("merchant_fee_percent") : parseFloat(MERCHANT_FEE)),
        }),

        currency: product ? product.get('currency') : business.get('currency'),
        product_name: product ? product.get('title') : (locale == 'he' ? 'סכום חופשי' : 'Free Amount'),
        sale_callback_url: process.env.WEBHOOK_BASE_URL + '/api/payment-request/success' + getWebhookUrl({ productType, product, business, client, amountToPay}),
        sale_name: client.get('name'),

        layout: 'micro_ltr',
        installments: 1,
        language: locale,
        sale_send_notification: false,

        ...(!isBuyerKeyValid && {
            capture_buyer: 1,
        }),
        ...(isBuyerKeyValid && {
            buyer_key: buyerKey,
        }),
    };

    let paymentUrl = process.env.PAYME_URL + '/api/generate-sale';

    console.log('params', params);
    console.log('paymentUrl', paymentUrl);

    let result = await axios({
        method: 'post',
        url: paymentUrl,
        data: params,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    }).catch(error => {
        console.log(error);
    })

    console.log(result.data);
    if (result.data.status_code == 0 || result.data.payme_status === 'success') {
        console.log('payme_status', result.data.payme_status);
        if (parseInt(productType) == 3) {
            response.success(isBuyerKeyValid ? result.data.payme_status : result.data.sub_url);
        } else {
            response.success(isBuyerKeyValid ? result.data.payme_status : result.data.sale_url);
        }
    } else {
        console.log('status_error_code', result.data.status_error_code);
        console.log('status_error_details', result.data.status_error_details);
        response.error(result.data.status_error_details);
    }
}

function getWebhookUrl(params) {
    console.log('getWebhookUrl params', params);
    let { productType, product, business, client} = params;

    var webhookParams = '?sellerId=' + business.id + '&buyerId=' + client.id + '&productType=' + productType;

    var webhookResult;
    switch (parseInt(productType)) {
        case 0://Free Amount
            webhookResult = webhookParams;
            break;
        case 1://Order
            webhookResult = webhookParams + '&productId=' + product.id;
            break;
        default:
            break;
    }
    console.log('webhookResult', webhookResult);
    return webhookResult;

}

function sellerPaidDirectly(seller) {
    return new Promise(async (resolve, reject) => {
        let result = await axios({
            method: 'post',
            url: process.env.PAYME_URL + '/api/get-sellers',
            data: { payme_client_key: process.env.PAYME_KEY, seller_payme_id: seller.get('payme_seller_id') },
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }).catch(error => {
            console.log(error);
        })

        let isPaidDirectly = (result && result.data && result.data.items && result.data.items.length > 0 && result.data.items[0].seller_is_paid_directly);
        console.log('isPaidDirectly', isPaidDirectly);
        resolve(isPaidDirectly);
    });
}

//productType 0-FREE_AMOUNT, 1-ORDER
async function refundProduct(request, response) {
    console.log('refundProduct');
    console.log('params', request.params);
    let { businessId, productType, clientId, productId } = request.params;

    let client = await utils.getObjectById('User', clientId);
    var product;
    var business;

    switch (parseInt(productType)) {
        case 0://Free AMount
            business = await utils.getObjectById('Business', businessId);
            break;
        case 1://Order
            product = await utils.getObjectById('RestaurantOrderSummary', productId);
            business = await utils.getObjectById('Business', product.get('business').id);
            break;
        default:
            break;
    }

    let { payment} = await getPaymentObject({ productType, product, client});

    let canRefund = await getSaleStatus(payment);

    if (!canRefund) {
        response.error('Payment already refunded');
        return;
    }

    console.log('payment', payment);

    var locale = business.get('language');
    locale = locale ? (locale.includes('he') ? 'he' : 'en') : 'en';

    var params = {
        payme_client_key: process.env.PAYME_KEY,
        seller_payme_id: owner.get('payme_seller_id'),
        payme_sale_id: payment.get('payme_sale_id'),
        language: locale
    };

    let refundUrl = process.env.PAYME_URL + '/api/refund-sale';

    console.log('params', params);
    console.log('refundUrl', refundUrl);

    let result = await axios({
        method: 'post',
        url: refundUrl,
        data: params,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    }).catch(error => {
        console.log(error);
    })

    if ((result && result.data) && (result.data.status_code == 0 || result.data.payme_status === 'success')) {
        console.log('result', result);
        console.log('payme_status', result.data.payme_status);
        response.success(result.data.sale_status);
    } else if (result && result.data) {
        console.log('status_error_code', result.data.status_error_code);
        console.log('status_error_details', result.data.status_error_details);
        response.error(result.data.status_error_details);
    } else {
        console.log('No result');
        response.error('Trouble refunding this payment');
    }
}

function getPaymentObject(params) {
    let { productType, product, client} = params;
    return new Promise(async (resolve, reject) => {

        var query;
        switch (parseInt(productType)) {
            case 1://Order
                var payment = await utils.getObjectById(PAYMENT_CLASS_NAME, paymentId);
                resolve({payment: payment});
                break;
            default:
                break;
        }
    });
}

function getSaleStatus(payment) {
    return new Promise(async (resolve, reject) => {
        let params = { payme_client_key: process.env.PAYME_KEY, sale_payme_id: payment.get('payme_sale_id') };
        let getSalesUrl = process.env.PAYME_URL + '/api/get-sales';
        console.log('params', params);
        console.log('getSalesUrl', getSalesUrl);
        let result = await axios({
            method: 'post',
            url: getSalesUrl,
            data: params,
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }).catch(error => {
            console.log(error);
        })
        console.log('getSaleStatus result', result);
        let sale = (result && result.data && result.data.items && result.data.items.length > 0 && result.data.items[0]);
        console.log('sale', sale ? JSON.stringify(sale) : 'Empty');
        let canRefundSale = (result && result.data && result.data.items && result.data.items.length > 0 && result.data.items[0].sale_status !== 'refunded');
        console.log('canRefund', canRefundSale);
        resolve(canRefundSale);
    });
}
