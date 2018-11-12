// var twilio = require('twilio')('AC086829ceac7f22890d88dd553860b529', 'cda23fe1665fbbe70d024c990e4e30d5');

module.exports = {
  sendVerificationCode: function (request, response) {
    sendVerificationCode(request, response);
  },
  blockUser: function (request, response) {
    blockUser(request, response);
  },
  unBlockUser: function (request, response) {
    unBlockUser(request, response);
  },
  getFullUsersFromIds: function (request, response) {
    getFullUsersFromIds(request, response);
  },
  getFullUserInstallationsFromIds: function (request, response) {
    getFullUserInstallationsFromIds(request, response);
  },
  createNewUser: function (request, response) {
    createNewUser(request, response);
  },
  saveUserSellerIdByEmail: function (request, response) {
    saveUserSellerIdByEmail(request, response);
  },
  saveAndroidUserDeviceToken: function (request, response) {
    saveAndroidUserDeviceToken(request, response);
  },
  createPaymentRequest: function (request, response) {
    createPaymentRequest(request, response);
  },
  paymentRequestSettled: function (request, response) {
    paymentRequestSettled(request, response);
  }
};

function sendVerificationCode(request, response) {
  var verificationCode = Math.floor(Math.random() * 899999 + 100000);

  const Nexmo = require('nexmo')
  const nexmo = new Nexmo({
    apiKey: '0d809a59',
    apiSecret: '8beb9f6d5f3f1637'
  })

  const from = 'DigiDine'
  const to = request.params.phoneNumber
  const text = "Your verification code is " + verificationCode

  nexmo.message.sendSms(
    from, to, text,
    (err, responseData) => {
      if (err) {
        response.error(err);
      } else {
        response.success(verificationCode);
      }
    }
  );
  // twilio.sendSms({
  //   From: "<Your Twilio phone number>",
  //   To: request.params.phoneNumber,
  //   Body: "Your verification code is " + verificationCode + "."
  // }, function(err, responseData) {
  //   if (err) {
  //     response.error(err);
  //   } else {
  //     response.success(verificationCode);
  //   }
  // });
}

function blockUser(request, response) {
  var params = request.params;
  var user = new Parse.User({
    id: params.userId
  }); //id of user to block
  user.set("blocked", true);
  user.save(null, {
    useMasterKey: true,
    success: function() {
      response.success("User was blocked from admin");
    },
    error: function(error) {
      response.error("Error saving message" + error.code);
    }
  });
}

function unBlockUser(request, response) {
  var params = request.params;
  var user = new Parse.User({
    id: params.userId
  }); //id of user to block
  user.set("blocked", false);
  user.save(null, {
    useMasterKey: true,
    success: function() {
      response.success("User was unblocked from admin");
    },
    error: function(error) {
      response.error("Error saving message" + error.code);
    }
  });
}

function getFullUsersFromIds(request, response) {
  //Parse.Cloud.useMasterKey(); //This is for the old server
  // request has 2 parameters: params passed by the client and the authorized user
  var params = request.params;

  var users = params.userIds; //ids of relevant users

  //Filter only users with thier ids in it
  var userQuery = new Parse.Query(Parse.User);
  userQuery.containedIn("objectId", users);
  userQuery.include("preferences");
  for (var i = 0; i < users.length; i++) {
    console.log("#### User Id Before Filtering " + users[i]);
  }
  userQuery.find({
    useMasterKey: true, //This is for the new version
    success: function(users) {
      console.log("Found..." + users.length);
      var emailsArray = [];
      for (var i = 0; i < users.length; i++) {
        emailsArray[i] = users[i].get("email");
      }
      response.success(users);
      //response.success(emailsArray);
    },

    error: function(error) {
      response.error(error);
    }
  });
}

function getFullUserInstallationsFromIds(request, response) {
  //     Parse.Cloud.useMasterKey();

  var params = request.params;
  var users = params.userIds; //ids of relevant users
  console.log("userIds - " + users.length);

  var query = new Parse.Query(Parse.Installation);
  query.containedIn("user", users);
  query.descending('updatedAt')
  query.find({
    useMasterKey: true, //This is for the new version
    success: function(results) {
      for (var i = 0; i < results.length; i++) {
        console.log("iterating over Installations");
      }
      console.log("Finished iterating over Installations");
      response.success(results);
    },
    error: function(error) {
      response.error(error);
    }
  });
}

function createNewUser(request, response) {
  console.log("createNewUser");
  var params = request.params;
  var {
    firstName,
    lastName,
    email,
    sellerPaymeId
  } = params;
  console.log('firstName:', firstName);
  console.log('lastName:', lastName);
  console.log('email:', email);
  var password = "pass";
  var user = new Parse.User();
  email = email.toLowerCase();
  if(sellerPaymeId){
    user.set({
      username: email,
      first_name: firstName,
      last_name: lastName,
      password,
      email,
      payme_seller_id : sellerPaymeId
    });
  }else{
    user.set({
      username: email,
      first_name: firstName,
      last_name: lastName,
      password,
      email
    });
  }

  user.signUp(null, {
    useMasterKey: true,
    success: function(user) {
      console.log('success', user);
      user.setPassword(user.id);
      user.save(null, { useMasterKey: true }).then((user) => {
        console.log("created new user sucessfully");
        response.success(user);
      }, (obj, error) => {
        console.log("error creating new user", error);
        response.error(error.message);
      });
    },
    error: function(user, error) {
      console.log('error', error);
      response.error(error);
    }
  });
}

function saveUserSellerIdByEmail(request, response){
  var params = request.params;
  console.log("saveUserSellerIdByEmail");
  console.log("email", params.email);
  console.log("seller_payme_id", params.seller_payme_id);

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("email", params.email);
  userQuery.find({
    success: function(users) {
      try {
        if(users && users.length > 0){
          var newIsraeliTeacher = users[0];
          console.log("found user", newIsraeliTeacher.id);
          newIsraeliTeacher.set("seller_payme_id", params.seller_payme_id);
          newIsraeliTeacher.save(null, {
            useMasterKey: true,
            success: function(user) {
              console.log("Saved Teacher Seller Id");
              response.success('success');
            },
            error: function(error) {
              console.log(error);
              response.error(error);
            }
          });
        } else{
          console.log("no user found, create one!");
          createNewUser(request, response)
          console.log("created new user");
        }
      } catch (error) {
        console.log(error);
        response.error(error);
      }
    },
    error: function(error) {
      response.error(error);
    }
  });
}

function saveAndroidUserDeviceToken(request, response) {
  //     Parse.Cloud.useMasterKey();
  var params = request.params;
  var user = request.user;
  var token = params.token; //GCM TOKEN
  var installation = params.installation; //ids of relevant users
  console.log("#### Installation Id To Save Token " + installation[0]);
  console.log("#### User GCM Token " + token);

  var installationQuery = new Parse.Query(Parse.Installation);
  installationQuery.equalTo('objectId', installation[0]);
  installationQuery.find({
    useMasterKey: true,
    success: function(installations) {
      console.log("#### Successfully retrieved Installation" + installations.length);
      var userInstallation = installations[0];
      userInstallation.set("deviceToken", token);
      userInstallation.save(null, {
        useMasterKey: true,
        success: function(listing) {
          console.log("#### Saved Token");
          response.success('success');
        },
        error: function(error) {
          console.log("#### Did Not Save Token...");
          response.error(error);
        }
      });
    },
    error: function(error) {
      console.log("#### Error: " + error.code + " " + error.message);
      response.error(error);
    },
  });
}

function createPaymentRequest(request, response) {
  try {
    var params = request.params;

    console.log("productType - " + params.productType);
    console.log("productObjectId - " + params.productObjectId);
    console.log("sellerObjectId - " + params.sellerObjectId);
    console.log("buyerObjectId - " + params.buyerObjectId);

    var productType = params.productType;
    var productObjectId = params.productObjectId;
    var sellerObjectId = params.sellerObjectId;
    var buyerObjectId = params.buyerObjectId;

    var sellerObject = new Parse.User({
      id: sellerObjectId //id of seller
    });

    var buyerObject = new Parse.User({
      id: buyerObjectId //id of buyer
    });

    var query = new Parse.Query("PaymentRequest");
    query.equalTo('buyer',buyerObject);
    query.equalTo('seller',sellerObject);

    var productObject;
    switch (productType) {
      case 0:
      query.exists('amount'); //Free amount
      query.notEqualTo('settled',true); //For Session
      break;
      case 1:
      var Session = Parse.Object.extend("MSession");
      productObject = new Session({
        id: productObjectId
      });
      query.equalTo('session',productObject); //For Session
      break;
      case 2:
      var Ticket = Parse.Object.extend("Ticket");
      productObject = new Ticket({
        id: productObjectId
      });
      query.equalTo('ticket',productObject); //For Ticket
      break;
      case 3:
      var Membership = Parse.Object.extend("Membership");
      productObject = new Membership({
        id: productObjectId
      });
      query.equalTo('membership',productObject); //For Membership
      break;
      default:
      break;
    }
    query.find({
      useMasterKey: true,
      success: function(paymentRequests) {
        if(paymentRequests !== null && paymentRequests.length > 0){
          response.success("Payment Request from you to this client for this product already exists");
        }
        else {
          try {

            var PaymentRequest = Parse.Object.extend("PaymentRequest");
            var paymentRequestObject = new PaymentRequest();
            paymentRequestObject.set('buyer',buyerObject);
            paymentRequestObject.set('seller',sellerObject);
            paymentRequestObject.set('product_type',productType);
            switch (productType) {
              case 0:
              break;
              case 1: paymentRequestObject.set('session',productObject); //For Session
              break;
              case 2: paymentRequestObject.set('ticket',productObject); //For Ticket
              break;
              case 3: paymentRequestObject.set('membership',productObject); //For Membership
              break;
              default:
              break;
            }
          } catch (error) {
            console.log(error);
            response.error(error);
          }

          paymentRequestObject.save().then(function(paymentRequest) {
            console.log("New Payment Request Object - succeedded with objectId " + paymentRequest.id);
            response.success("Payment Request successfully created");
          }, function(error) {
            console.log("Returning Error - " + error);
            response.error(error);
          });
        }
      },
      error: function(error) {
        console.log(error);
        response.error(error);
      },
    });
  } catch (error) {
    console.log(error);
    response.error(error);
  }
}

function paymentRequestSettled(request, response) {
  console.log("paymentRequestSettled");
  var params = request.params;

  var productType = params.productType;
  var productObjectId = params.productObjectId;
  var sellerObjectId = params.sellerObjectId;
  var buyerObjectId = params.buyerObjectId;

  console.log("paymentRequestSettled params ", JSON.stringify(params));

  var sellerObject = new Parse.User({
    id: sellerObjectId //id of seller
  });

  var buyerObject = new Parse.User({
    id: buyerObjectId //id of buyer
  });

  var query = new Parse.Query("PaymentRequest");
  query.equalTo('buyer',buyerObject);
  query.equalTo('seller',sellerObject);

  var productObject;
  switch (productType) {
    case 0:
    console.log("free amount");
    query.exists('amount'); //For Session//Free amount
    query.notEqualTo('settled',true); //For Session
    break;
    case 1:
    console.log("session");
    var Session = Parse.Object.extend("MSession");
    productObject = new Session({
      id: productObjectId
    });
    query.equalTo('session',productObject); //For Session
    break;
    case 2:
    console.log("ticket");
    var Ticket = Parse.Object.extend("Ticket");
    productObject = new Ticket({
      id: productObjectId
    });
    query.equalTo('ticket',productObject); //For Ticket
    break;
    case 3:
    console.log("membership");
    var Membership = Parse.Object.extend("Membership");
    productObject = new Membership({
      id: productObjectId
    });
    query.equalTo('membership',productObject); //For Membership
    break;
    default:
    console.log("none");
    break;
  }
  query.find({
    useMasterKey: true,
    success: function(paymentRequests) {
      if(paymentRequests !== null && paymentRequests.length > 0){
        var paymentRequest = paymentRequests[0];
        console.log("paymentRequest ", paymentRequest.id);
        paymentRequest.set("is_settled",true);
        paymentRequest.save(null, {
          useMasterKey: true,
          success: function(paymentRequest) {
            console.log("Payment Request settled");
            response.success("Payment Request settled");
          },
          error: function(error) {
            console.log(error);
            response.error(error);
          }
        });
      } else {
        console.log("Payment Request does not exist for this seller/buyer/product combination");
        response.success("Payment Request does not exist for this seller/buyer/product combination");
      }
    },
    error: function(error) {
      console.log("error");
      response.error(error);
    },
  });
}
