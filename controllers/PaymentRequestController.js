const utils = require('../cloud/utils.js');

var PAYMENT_CLASS_NAME = process.env.ENV === 'development' ? 'PaymentDebug' : 'Payment';
var PAYMENT_FIELD_NAME = process.env.ENV === 'development' ? 'payment_debug' : 'payment';

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

//   if (req.body.sub_payme_id && (req.body.notify_type && req.body.notify_type !== "sub-active")) {
//     console.log('notify_type is not for a complete payment, stop process..')
//     return;
//   }

//   let { productType, buyerId, sellerId, sessionId, ticketId, membershipId, userPaymentPlanId, userPaymentProductId, isMedidateMemberhip } = req.query;
//   let params = req.query;
//   console.log('savePayment params', params);

//   var Payment = Parse.Object.extend(PAYMENT_CLASS_NAME);
//   var payment = new Payment();

//   var session;
//   var ticket;
//   var membership;
//   var userPaymentP;
//   var product;
//   var productObjectId;

//   var buyer = await getObjectById('User', buyerId);
//   var seller = await getObjectById('User', sellerId);

//   switch (parseInt(productType)) {
//     case 1://Session
//       session = await getObjectById('MSession', sessionId);
//       productObjectId = sessionId;
//       break;
//     case 2://Ticket
//       ticket = await getObjectById('Ticket', ticketId);
//       productObjectId = ticketId;
//       userPaymentP = userPaymentPlanId ? await getObjectById('UserPaymentPlan', userPaymentPlanId) : await utils.createUserPaymentPlanOrProduct(ticket, buyer);;
//       break;
//     case 3://Membership
//       membership = await getObjectById('Membership', membershipId);
//       productObjectId = membershipId;
//       isMedidateMemberhip = utils.parseBoolean(isMedidateMemberhip);
//       userPaymentP = userPaymentPlanId ? await getObjectById('UserPaymentPlan', userPaymentPlanId) : await utils.createUserPaymentPlanOrProduct(membership, buyer);;
//       break;
//     case 4://Product
//       product = await getObjectById('MProduct', req.query.productId);
//       productObjectId = req.query.productId;
//       userPaymentP = userPaymentProductId ? await getObjectById('UserPaymentProduct', userPaymentProductId) : await utils.createUserPaymentPlanOrProduct(product, buyer);;
//       break;
//     default:
//       break;
//   }

//   console.log('session', session)
//   console.log('userPaymentP', userPaymentP)
//   console.log('ticket', ticket)
//   console.log('membership', membership)
//   console.log('isMedidateMemberhip', isMedidateMemberhip)
//   console.log('product', product)
//   console.log('buyer', buyer)
//   console.log('seller', seller)
//   console.log('sub_payme_id', req.body.sub_payme_id)
//   console.log('notify_type', req.body.notify_type)
//   console.log('amount', req.body.amount)
  

//   var price = req.body.price ? parseInt(req.body.price) : (req.body.sale_price ? parseInt(req.body.sale_price) : parseInt(req.body.sub_price));
//   var paymentParams = {
//     buyer,
//     teacher: seller,
//     productType : parseInt(productType),
//     productObjectId,
//     session, ticket, membership, product,
//     is_ticket: !!ticket,
//     is_membership: !!membership,
//     is_product: !!product,
//     is_medidate_membership: isMedidateMemberhip,
//     in_israel: seller.get('bank_country') === 'Israel',

//     // data from payme
//     currency: req.body.currency,
//     price: price / 100,
//     payme_transaction_id: req.body.payme_transaction_id,
//     payme_json: JSON.stringify(req.body),
//     sub_payme_id: req.body.sub_payme_id,
//     sub_payme_code: req.body.sub_payme_code,

//     payme_sale_id: req.body.payme_sale_id,
//     payme_sale_code: req.body.payme_sale_code,
//     payment_method_type: 4 //paymentType.CREDIT_CARD
//   }
//   console.log("savePayment ", JSON.stringify(paymentParams));

//   payment.save(paymentParams, {
//     success: function (res) {
//       console.log('success createing payment!', res);
//       try {
//         paymentRequestSettled(paymentParams, payment);
//         if(userPaymentP){
//           savePaymentToUserPaymentP({userPaymentP, payment})
//           if (isMedidateMemberhip) {
//             buyer.save({ 'subscription': userPaymentP }, { useMasterKey: true });
//           }
//         }

//         sendEmailsAboutPurchase(buyer, seller, paymentParams.price, paymentParams.productType, productObjectId);
        
//       } catch (error) {
//         console.log(error);
//       }
//     },
//     error: function (err) {
//       console.log('err createing payment!', err);
//     }
//   });

//   if (req.body.buyer_key) {

//     var buyer = await utils.getUserByEmail(req.body.buyer_email);
//     buyer.save({ 'payme_buyer_key': req.body.buyer_key }, { useMasterKey: true });
//     console.log('Saved buyer key to user', buyer.id);
//   }
// }

// function paymentRequestSettled(paymentParams, payment) {
//   try {
//     console.log('Try settle payment');
//     params = {
//       productType: paymentParams.productType,
//       productObjectId: paymentParams.productObjectId,
//       sellerObjectId: paymentParams.teacher.id,
//       buyerObjectId: paymentParams.buyer.id
//     };

//     Parse.Cloud.run('paymentRequestSettled', params, {
//       success: (res) => {
//         console.log('success settled payment!', res.id);
//       },
//       error: (err) => {
//         console.log(err);
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// }

// function savePaymentToUserPaymentP(params) {
//   let {userPaymentP, payment} = params;
//   try {
//     if (userPaymentP) {
//       userPaymentP.set(PAYMENT_FIELD_NAME, payment);
//       userPaymentP.save({}, { useMasterKey: true });
//     }
//   } catch (error) {
//     console.log(error);
//   }
}

// function savePaymentToUserPaymentPlan(userPaymentPlan, payment, userPaymentProduct, buyer, isMedidateMemberhip) {
//   try {
//     if (userPaymentPlan) {

//       userPaymentPlan.set(PAYMENT_FIELD_NAME, payment);
//       userPaymentPlan.save({}, {
//         success: function (upp) {
//           console.log('UserPaymentPlan update success', upp)
//         },
//         error: function (error) {
//           console.log('Failed to update object, with error code: ' + error.message);
//         }
//       });
//     }
//     if (userPaymentProduct) {

//       userPaymentProduct.set(PAYMENT_FIELD_NAME, payment);
//       userPaymentProduct.save({}, {
//         success: function (upp) {
//           console.log('userPaymentProduct update success', upp)
//         },
//         error: function (error) {
//           console.log('Failed to update object, with error code: ' + error.message);
//         }
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }



// function saveNewUserPaymentPlanFromPlan(plan, payment, seller, buyer, isMedidateMemberhip) {
//   try {
//     if (!plan || !payment || !buyer)
//       return;

//     console.log('saveNewUserPaymentPlanFromMembership')
//     console.log('buyer', buyer)
//     console.log('seller', seller)
//     console.log('plan', plan)
//     console.log('isMedidateMemberhip', isMedidateMemberhip)
//     var moment = require('moment');

//     var UserPaymentPlan = Parse.Object.extend('UserPaymentPlan');
//     var userPaymentPlan = new UserPaymentPlan();
//     userPaymentPlan.set(PAYMENT_FIELD_NAME, payment);
//     userPaymentPlan.save({
//       [plan.className.toLowerCase()]: plan,
//       buyer: buyer,
//       owner: seller,
//       is_medidate_membership: isMedidateMemberhip || true,
//       expiration_date: new Date(moment().add(plan.get('expiration_period'), 'weeks'))
//     }, {
//       success: function (userPaymentPlan) {
//         //We don't have the userPaymentPlan here, so we need to create it now
//         if (isMedidateMemberhip) {
//           saveUserMedidateSubscription(userPaymentPlan, buyer, isMedidateMemberhip);
//         }
//         console.log('New UserPaymentPlan saved success', upp)
//       },
//       error: function (error) {
//         console.log('Failed to save new UserPaymentPlan, with error code: ' + error.message);
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// }

// function saveUserMedidateSubscription(userPaymentPlan, buyer, isMedidateMemberhip) {
//   buyer.set("subscription", userPaymentPlan);
//   buyer.save(null, {
//     useMasterKey: true,
//     success: function (buyer) {
//       console.log("User Just Registered to Medidate");
//       console.log("User:", buyer.id);
//       console.log("Subscription (UserPaymentPlan):", upp.id);
//       response.success("User: " + buyer.id + " Just Registered to Medidate with Subscription: " + upp.id);
//     },
//     error: function (error) {
//       console.log(error);
//       response.error(error);
//     }
//   });
// }

function canSavePayment(req) {
  return req.body.payme_status === 'success';
}

module.exports = function (req, res) {
  // console.log('Recived payment request success from payme. REQ:', req);
  console.log('Recived payment request success from payme. REQ BODY:', req.body);
  // console.log('Recived payment request success from payme. RES:', res);
  console.log('canSavePayment?', canSavePayment(req));

  if (canSavePayment(req)) {
    savePayment(req);
  }
  res.status(200).send('OK');
}

function sendEmailsAboutPurchase(student, owner, amount, productType, productId) {
  console.log('sendEmailsAboutPurchase');

  var objectIdName;
  var emailTypeToStudio;
  var emailTypeToStudent;
  switch (parseInt(productType)) {
      case 0://Session
          objectIdName = 'userId';
          emailTypeToStudio = 10;
          emailTypeToStudent = 9;
          productId = owner.id;
          break;
      case 1://Session
          objectIdName = 'sessionId';
          emailTypeToStudio = 3;
          emailTypeToStudent = 2;
          break;
      case 2://Ticket
          objectIdName = 'ticketId';
          emailTypeToStudio = 12;
          emailTypeToStudent = 11;
          break;
      case 3://Membership
          objectIdName = 'membershipId';
          emailTypeToStudio = 14;
          emailTypeToStudent = 13;
          break;
      case 4://Product
          objectIdName = 'productId';
          emailTypeToStudio = 29;
          emailTypeToStudent = 30;
          break;
      default:
          break;
  }

  var emailParams = {
      toEmail: owner.get('username'),
      toName: owner.get('first_name') + owner.get('last_name'),
      fromName: 'Medidate', //student.get('first_name') + ' ' + student.get('last_name'),
      fromEmail: 'no-reply@medidatewith.me',
      paidPrice: amount,
      paidTitle: student.get('first_name') + ' ' + student.get('last_name'),
      [objectIdName]: productId,
      emailType: emailTypeToStudio,
      importSenderId: owner.id
  };

  if (parseInt(productType) == 0) {
      emailParams.fromName = 'Medidate';
  }

  Parse.Cloud.run('sendEmailsToUsers', emailParams, {
      success: function (result) {
          console.log('success sendEmailsToUsers');
      },
      error: function (error) {
          console.log('error', error);
      }
  });

  emailParams = {
      toEmail: student.get('username'),
      toName: student.get('first_name') + ' ' + student.get('last_name'),
      fromName: 'Medidate',//student.get('first_name') + ' ' + student.get('last_name'),
      fromEmail: 'no-reply@medidatewith.me',
      paidPrice: amount,
      paidTitle: student.get('first_name') + ' ' + student.get('last_name'),
      [objectIdName]: productId,
      emailType: emailTypeToStudent,
      importSenderId: owner.id
  };

  if (parseInt(productType) == 0) {
      emailParams.paidTitle = owner.get('first_name') + owner.get('last_name');
  }
  Parse.Cloud.run('sendEmailsToUsers', emailParams, {
      success: function (result) {
          console.log('success sendEmailsToUsers');
      },
      error: function (error) {
          console.log('error', error);
      }
  });
}