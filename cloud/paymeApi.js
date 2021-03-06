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
    let { isDebug, businessId, productType, clientId, productId, amount, sendAsPaymentRequest, tip, special_note, salePaymentMethod, newCreditCard } = request.params;

    let client = await utils.getObjectById('User', clientId);
    var product;
    var business;
    var note = encodeURI(special_note);

    switch (parseInt(productType)) {
        case 0://Free AMount
            business = await utils.getObjectById('Business', businessId);
            break;
        case 1://Order
            product = await utils.getObjectById('RestaurantOrderSummary', productId);
            business = await utils.getObjectById('Business', businessId);
            break;
        default:
            break;
    }

    let isSellerPaidDirectly = await sellerPaidDirectly(business, isDebug);

    var locale = business.get('language');
    locale = locale ? (locale.includes('he') ? 'he' : 'en') : 'en';

    let amountToPay = tip ? Math.floor((amount + tip) * 100) : Math.floor((amount) * 100);

    let buyerKey = client.get('payme_buyer_key');
    let isBuyerKeyValid = !utils.isEmpty(buyerKey);
    let currency = business.get('currency') == "NIS" ? "ILS" : "USD"; //currency name to iso4217

    console.log('buyerKey', buyerKey);
    console.log('amountToPay', amountToPay);

    params = {
        seller_payme_id: isDebug ? business.get('payme_seller_id_debug') : business.get('payme_seller_id'),
        sale_price: amountToPay.toString(),

        ...(!isSellerPaidDirectly && {
            market_fee: parseFloat(MERCHANT_FEE),
        }),

        currency,
        product_name: product ? product.id : (locale == 'he' ? 'סכום חופשי' : 'Free Amount'),
        sale_callback_url: process.env.WEBHOOK_BASE_URL + '/api/payment-request/success' + getWebhookUrl({ productType, product, business, client, amount, tip, note }),
        sale_name: client.get('name'),

        language: locale,
        sale_send_notification: false,
        ...(salePaymentMethod && {
            sale_payment_method: salePaymentMethod,
            ...(salePaymentMethod == 'bit' && {
                layout: salePaymentMethod,
            }),
            ...(salePaymentMethod != 'bit' && {
                layout: 'micro_ltr',
            }),
        }),
        ...(!salePaymentMethod && {
            layout: 'micro_ltr',
        }),

        ...(!sendAsPaymentRequest && {
                ...(!isBuyerKeyValid && {
                    ...(salePaymentMethod && {
                        sale_payment_method: salePaymentMethod,
                        ...(salePaymentMethod != 'bit' && {
                            installments: 1,
                            capture_buyer: 1
                        }),
                    }),
                    ...(!salePaymentMethod && {
                        installments: 1,
                        capture_buyer: 1
                    }),
                    
                }),
                ...(isBuyerKeyValid && {
                    buyer_key: buyerKey,
                    installments: 1
                }),

            })
    };

    let paymentUrl = (isDebug ? process.env.PAYME_URL_DEBUG : process.env.PAYME_URL) + '/api/generate-sale';

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

    try {
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
    } catch (error) {
        response.error(error);
    }
}

function getWebhookUrl(params) {
    console.log('getWebhookUrl params', params);
    let { productType, product, business, client, amount, tip, note } = params;

    var special_note = note ? note : "";
    var webhookParams = '?businessId=' + business.id + '&buyerId=' + client.id + '&productType=' + productType + '&tip=' + tip + '&note=' + special_note;

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

function sellerPaidDirectly(business, isDebug) {
    return new Promise(async (resolve, reject) => {
        if (process.env.PAYME_KEY.length > 0) {
            let result = await axios({
                method: 'post',
                url: (isDebug ? process.env.PAYME_URL_DEBUG : process.env.PAYME_URL) + '/api/get-sellers',
                data: { payme_client_key: process.env.PAYME_KEY, seller_payme_id: isDebug ? business.get('payme_seller_id_debug') : business.get('payme_seller_id') },
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }).catch(error => {
                console.log(error);
            })

            let isPaidDirectly = (result && result.data && result.data.items && result.data.items.length > 0 && result.data.items[0].seller_is_paid_directly);
            console.log('isPaidDirectly', isPaidDirectly);
            resolve(isPaidDirectly);
        } else {
            resolve(false);
        }
    });
}

//productType 0-FREE_AMOUNT, 1-ORDER
async function refundProduct(request, response) {
    console.log('refundProduct');
    console.log('params', request.params);

    if (process.env.PAYME_KEY.length > 0) {
        let { isDebug, businessId, productType, clientId, productId } = request.params;

        let client = await utils.getObjectById('User', clientId);
        var product;
        var business;

        switch (parseInt(productType)) {
            case 0://Free AMount
                business = await utils.getObjectById('Business', businessId);
                break;
            case 1://Order
                product = await utils.getObjectById('RestaurantOrderSummary', productId);
                business = await utils.getObjectById('Business', businessId);
                break;
            default:
                break;
        }

        let { payment } = await getPaymentObject({ productType, product, client });

        let canRefund = await getSaleStatus(payment, isDebug);

        if (!canRefund) {
            response.error('Payment already refunded');
            return;
        }

        console.log('payment', payment);

        var locale = business.get('language');
        locale = locale ? (locale.includes('he') ? 'he' : 'en') : 'en';

        var params = {
            payme_client_key: process.env.PAYME_KEY,
            seller_payme_id: isDebug ? business.get('payme_seller_id_debug') : business.get('payme_seller_id'),
            payme_sale_id: payment.get('payme_sale_id'),
            language: locale
        };

        let refundUrl = (isDebug ? process.env.PAYME_URL_DEBUG : process.env.PAYME_URL) + '/api/refund-sale';

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
    } else {
        response.error('Trouble refunding this payment');
    }
}

function getPaymentObject(params) {
    let { productType, product, client } = params;
    return new Promise(async (resolve, reject) => {

        var query;
        switch (parseInt(productType)) {
            case 1://Order
                var payment = await utils.getObjectById(PAYMENT_CLASS_NAME, paymentId);
                resolve({ payment: payment });
                break;
            default:
                break;
        }
    });
}

function getSaleStatus(payment, isDebug) {
    return new Promise(async (resolve, reject) => {
        if (process.env.PAYME_KEY.length > 0) {
            let params = { payme_client_key: process.env.PAYME_KEY, sale_payme_id: payment.get('payme_sale_id') };
            let getSalesUrl = (isDebug ? process.env.PAYME_URL_DEBUG : process.env.PAYME_URL) + '/api/get-sales';
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
        } else {
            resolve(false);
        }
    });
}
