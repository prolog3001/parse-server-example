// { payme_status: 'success',
// status_error_code: '0',
// status_code: '0',
// seller_payme_id: 'MPL15336-57950VB8-Q48SYD7I-4BOOLBJB',
// seller_created: '2018-08-07 19:05:50',
// seller_first_name: 'Test',
// seller_last_name: 'User',
// seller_social_id: '858301005',
// seller_birthdate: '1970-01-01',
// seller_date_of_birth: '1970-01-01',
// seller_email: 'matandahan+1111@gmail.com',
// seller_contact_email: 'matandahan+1111@gmail.com',
// seller_phone: '+972501231231',
// seller_contact_phone: '050-123-1231',
// seller_inc: '2',
// seller_inc_code: '9999999999',
// seller_merchant_name: 'Test Inc',
// seller_site_url: 'google.com',
// seller_active: '0',
// seller_approved: '0',
// seller_market_fee: '0',
// 'seller_currencies[0]': 'ILS',
// 'seller_currencies[1]': 'USD',
// 'seller_currencies[2]': 'EUR',
// fee_default_processing_fee: '1.90',
// fee_default_processing_charge: '1.20',
// fee_default_discount_fee: '0.50',
// fee_foreign_processing_fee: '2.90',
// fee_foreign_processing_charge: '0.30',
// fee_forcurr_processing_charge: '0.30',
// notify_type: 'seller-create' }

async function saveBusiness(req) {
  console.log('saveUser');
  var businessId = req.query.businessId;
  console.log('businessId', businessId);

  var params = {
    sellerPaymeId : req.body.seller_payme_id,
    businessId : businessId,
  }

  Parse.Cloud.run('saveBusinessSellerId', params, {
    success: (res) => {
      console.log('success saving user');
    },
    error: (err) => {
      console.log(err);
    }
  });
}

function canSaveBusiness(req) {
  return req.body.payme_status === 'success';
}

module.exports = function(req, res) {
  // console.log('Recived response on new user registering payments. REQ:', req);
  console.log('Recived  response on new user registering payments. REQ BODY:', req.body);
  // console.log('Recived  response on new user registering payments. RES:', res);
  console.log('canSaveUser?', canSaveBusiness(req));

  if (canSaveBusiness(req)) {
    saveBusiness(req);
  }
  res.status(200).send('OK');
}
