const utils = require('../cloud/utils.js');

const PAYMENT_CLASS_NAME = 'Payment';
const PAYMENT_FIELD_NAME = 'payment';

function getObjectById(className, id) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(className);
    query.equalTo('objectId', id);
    query.find({
      useMasterKey: true,
      success: function (res) {
        resolve(res[0]);
      },
      error: function (err) {
        console.log('err when finding object', err)
        reject(err);
      }
    });
  });
}

async function savePayment(req) {
  console.log('savePayment');

  let { productType, clientId, businessId, productId} = req.query;

  let tip = req.query.tip;
  if(tip >= 0)
    tip = parseFloat(tip)
  else 
    tip = 0

  var Payment = Parse.Object.extend(PAYMENT_CLASS_NAME);
  var payment = new Payment();

  var product;
  var productObjectId;

  var client = Parse.User.createWithoutData(clientId);
  var business = await getObjectById('Business', businessId);

  switch (parseInt(productType)) {

    case 1://Order
      product = await getObjectById('RestaurantOrderSummary', productId);
      productObjectId = productId;
      break;
    default:
      break;
  }

  if(!tip)
    tip = 0;

  var price = parseInt(req.body.price)-tip;
  var paymentParams = {
    client,
    business: business,
    productType: parseInt(productType),
    productObjectId,
    restaurant_order_summary: product,
    in_israel: true,

    ...(req.body.sale_invoice_url && {
      auto_invrec_or_receipt: req.body.sale_invoice_url,
    }),
    // data from payme
    currency: req.body.currency,
    price: price / 100,
    tip,
    payme_transaction_id: req.body.payme_transaction_id,
    payme_json: JSON.stringify(req.body),
    sub_payme_id: req.body.sub_payme_id,
    sub_payme_code: req.body.sub_payme_code,

    payme_sale_id: req.body.payme_sale_id,
    payme_sale_code: req.body.payme_sale_code
  }
  // console.log("savePayment ", JSON.stringify(paymentParams));

  payment.save(paymentParams, {
    success: function (res) {
      console.log('success createing payment!', res);
      try {
        //sendEmailsAboutPurchase(client, seller, paymentParams.price, paymentParams.productType, productObjectId);
      } catch (error) {
        console.log(error);
      }
    },
    error: function (err) {
      console.log('err createing payment!', err);
    }
  });
}

async function setPaymentAsRefunded(req) {
  console.log('setPaymentAsRefunded');
  let payment = await getPaymentObject(req.body.payme_sale_id);

  //Refund Session
  if (payment.get('product')) {//Refund Product
    payment.save({ 'refunded': true }, { useMasterKey: true });
  }
}

function paymentRequestSettled(paymentParams, payment) {
  try {
    console.log('Try settle payment');
    params = {
      productType: paymentParams.productType,
      productObjectId: paymentParams.productObjectId,
      sellerObjectId: paymentParams.business.id,
      buyerObjectId: paymentParams.client.id
    };

    Parse.Cloud.run('paymentRequestSettled', params, {
      success: (res) => {
        console.log('success settled payment!', res.id);
      },
      error: (err) => {
        console.log(err);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

// function sendEmailsAboutPurchase(student, owner, amount, productType, productId) {
//   console.log('sendEmailsAboutPurchase');

//   var objectIdName;
//   var emailTypeToStudio;
//   var emailTypeToStudent;
//   switch (parseInt(productType)) {
//     case 0://Free Amount
//       objectIdName = 'userId';
//       emailTypeToStudio = 10;
//       emailTypeToStudent = 9;
//       productId = owner.id;
//       break;
//     case 1://Session
//       objectIdName = 'sessionId';
//       emailTypeToStudio = 3;
//       emailTypeToStudent = 2;
//       break;
//     case 2://Ticket
//       objectIdName = 'ticketId';
//       emailTypeToStudio = 12;
//       emailTypeToStudent = 11;
//       break;
//     case 3://Membership
//       objectIdName = 'membershipId';
//       emailTypeToStudio = 14;
//       emailTypeToStudent = 13;
//       break;
//     case 4://Product
//       objectIdName = 'productId';
//       emailTypeToStudio = 29;
//       emailTypeToStudent = 30;
//       break;
//     default:
//       break;
//   }

//   var emailParams = {
//     toEmail: owner.get('username'),
//     toName: owner.get('first_name') + owner.get('last_name'),
//     fromName: 'Medidate', //student.get('first_name') + ' ' + student.get('last_name'),
//     fromEmail: 'no-reply@medidatewith.me',
//     paidPrice: amount,
//     paidTitle: student.get('first_name') + ' ' + student.get('last_name'),
//     [objectIdName]: productId,
//     emailType: emailTypeToStudio,
//     importSenderId: owner.id
//   };

//   if (parseInt(productType) == 0) {
//     emailParams.fromName = 'Medidate';
//   }

//   Parse.Cloud.run('sendEmailsToUsers', emailParams, {
//     success: function (result) {
//       console.log('success sendEmailsToUsers');
//     },
//     error: function (error) {
//       console.log('error', error);
//     }
//   });

//   emailParams = {
//     toEmail: student.get('username'),
//     toName: student.get('first_name') + ' ' + student.get('last_name'),
//     fromName: 'Medidate',//student.get('first_name') + ' ' + student.get('last_name'),
//     fromEmail: 'no-reply@medidatewith.me',
//     paidPrice: amount,
//     paidTitle: student.get('first_name') + ' ' + student.get('last_name'),
//     [objectIdName]: productId,
//     emailType: emailTypeToStudent,
//     importSenderId: owner.id
//   };

//   if (parseInt(productType) == 0) {
//     emailParams.paidTitle = owner.get('first_name') + owner.get('last_name');
//   }
//   Parse.Cloud.run('sendEmailsToUsers', emailParams, {
//     success: function (result) {
//       console.log('success sendEmailsToUsers');
//     },
//     error: function (error) {
//       console.log('error', error);
//     }
//   });
// }

function getPaymentObject(saleId) {
  return new Promise((resolve, reject) => {
    var query = query = new Parse.Query(PAYMENT_CLASS_NAME);
    query.equalTo('payme_sale_id', saleId);
    query.limit(1);
    query.find({
      useMasterKey: true,
      success: function (res) {
        resolve(res[0]);
      },
      error: function (err) {
        console.log('err getPaymentObject', err)
        reject(err);
      }
    });
  });
}

function canSavePayment(req) {
  return (req.body.notify_type && (req.body.notify_type === 'sale-complete' ||
    req.body.notify_type === 'sub-iteration-success' || req.body.notify_type === 'sub-active'));
}

function isRefundedPayment(req) {
  return (req.body.notify_type && req.body.notify_type === 'refund');
}

module.exports = function (req, res) {
  console.log('PaymentRequestController');
  console.log('Recived payment action with req.body:', req.body);
  console.log('Recived payment action with req.query:', req.query);

  console.log('canSavePayment?', canSavePayment(req));
  console.log('isRefundedPayment?', isRefundedPayment(req));

  if (req.body.buyer_key) {
    var phone = req.body.buyer_contact_phone ? req.body.buyer_contact_phone : req.body.buyer_phone;
    // var number = phone.replace(/\D/g, '').slice(-10);
    // utils.saveBuyerKeyToUser(number, req.body.buyer_key);
    utils.saveBuyerKeyToUser(req.query.clientId, req.body.buyer_key);
  }

  if (isRefundedPayment(req)) {
    setPaymentAsRefunded(req);
  } else if (canSavePayment(req)) {
    savePayment(req);
  }
  res.status(200).send('OK');
}