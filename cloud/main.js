var users = require('./users.js');
var utils = require('./utils.js');
var payme = require('./payme.js');
var tables = require('./tables.js');
var background = require('./background.js');

Parse.Cloud.define("sendVerificationCode", users.sendVerificationCode);
Parse.Cloud.job("sendVerificationCode", users.sendVerificationCode);

Parse.Cloud.define("sendTableOrderSMS", users.sendTableOrderSMS);
Parse.Cloud.job("sendTableOrderSMS", users.sendTableOrderSMS);

Parse.Cloud.define("blockUser", users.blockUser);
Parse.Cloud.define("unBlockUser", users.unBlockUser);
Parse.Cloud.define("getFullUsersFromIds", users.getFullUsersFromIds);
Parse.Cloud.define("getFullUserInstallationsFromIds", users.getFullUserInstallationsFromIds);
Parse.Cloud.define("createNewUser", users.createNewUser);
Parse.Cloud.define("saveUserSellerIdByEmail", users.saveUserSellerIdByEmail);
Parse.Cloud.define("saveAndroidUserDeviceToken", users.saveAndroidUserDeviceToken);
Parse.Cloud.define("createPaymentRequest", users.createPaymentRequest);
Parse.Cloud.define("paymentRequestSettled", users.paymentRequestSettled);
Parse.Cloud.define("blockUser", users.blockUser);
Parse.Cloud.define("unBlockUser", users.unBlockUser);

Parse.Cloud.define("sendSMS", utils.sendSMS);
Parse.Cloud.define("uploadImage", utils.uploadImage);
Parse.Cloud.define("dateDSTPresenter", utils.dateDSTPresenter);
Parse.Cloud.define("dateDSTBeforeSessionSave", utils.dateDSTBeforeSessionSave);
Parse.Cloud.define("getRegaxCurrencySign", utils.getRegaxCurrencySign);
Parse.Cloud.define("replaceAll", utils.replaceAll);


Parse.Cloud.define("closeOpenedOrders", background.closeOpenedOrders);
Parse.Cloud.job("closeOpenedOrders", background.closeOpenedOrders);

// Parse.Cloud.afterSave("RestaurantOrderSummary", function (request) {
//     var orderSummaryPointer = request.object;
//     console.log("Object Type", orderSummaryPointer.className);
//     console.log("Object Table", orderSummaryPointer.get("table"));

//     var userQuery = new Parse.Query("RestaurantOrderSummary");
//     userQuery.containedIn("objectId", orderSummaryPointer.id);
//     userQuery.include("table");

//     userQuery.find({
//         useMasterKey: true, 
//         success: function (orderSummaries) {
//             console.log("Found..." + orderSummaries.length);
//             orderSummaryObject = orderSummaries[0];

//             if (orderSummaryObject && orderSummaryObject.className == "RestaurantOrderSummary" &&
//                 orderSummaryObject.get("table") && orderSummaryObject.get("table").get("title") == "TA") {
//                 orderSummaryObject.unset("table");
//                 if (orderSummaryObject.get("table")) {
//                     console.log("Fail, cant delete order table");
//                     return;
//                 }

//                 orderSummaryObject.save(null, { useMasterKey: true })
//                     .then(function (result) {
//                         console.log("Success saving after table removal", result);
//                     }, function (error) {
//                         console.log("Error", error);
//                     });
//             } else {
//                 console.log("Not OrderSummary or dont need changes");
//             }
//         },

//         error: function (error) {
//             console.log("Query Error", error);
//         }
//     });
// })

Parse.Cloud.afterSave("Table", function (request) {
    if (request.object.existed() === false) {
        // It's a new object 
        var table = request.object;
        console.log("Object Type", table.className);
        console.log("Object Title", table.get("title"));

        if (table &&
            table.get("title") == "TA") {
            table.destroy({
                success: function (res) {
                    log('success destroy', res)
                },
                error: function (error) {
                    log('Failed to destroy object, with error code: ' + error.message);
                }
            });
        } else {
            console.log("Not Table or dont need changes");
        }
    } else {
        // It's an existing object
    }
})
