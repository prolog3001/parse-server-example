var users = require('./users.js');
var utils = require('./utils.js');
var payme = require('./payme.js');
var background = require('./background.js');

Parse.Cloud.define("sendSMS", users.sendSMS);
Parse.Cloud.define("sendVerificationCode", users.sendVerificationCode);
Parse.Cloud.job("sendVerificationCode", users.sendVerificationCode);
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

Parse.Cloud.define("uploadImage", utils.uploadImage);
Parse.Cloud.define("dateDSTPresenter", utils.dateDSTPresenter);
Parse.Cloud.define("dateDSTBeforeSessionSave", utils.dateDSTBeforeSessionSave);
Parse.Cloud.define("getPricesAccordingToCommission", utils.getPricesAccordingToCommission);
Parse.Cloud.define("getNetPriceAfterCommission", utils.getNetPriceAfterCommission);
Parse.Cloud.define("getTotalPriceIncludingCommission", utils.getTotalPriceIncludingCommission);
Parse.Cloud.define("calculateTeacherNetPrice", utils.calculateTeacherNetPrice);
Parse.Cloud.define("calculateStudentNetPayment", utils.calculateStudentNetPayment);
Parse.Cloud.define("checkIfSplashSeller", utils.checkIfSplashSeller);
Parse.Cloud.define("getRegaxCurrencySign", utils.getRegaxCurrencySign);
Parse.Cloud.define("checkIfNotDollar", utils.checkIfNotDollar);
Parse.Cloud.define("replaceAll", utils.replaceAll);

Parse.Cloud.define("payme.updateSellerFiles", payme.updateSellerFiles);
Parse.Cloud.define("payme.getSeller", payme.getSeller);
Parse.Cloud.define("payme.registerTeacher", payme.registerTeacher);

Parse.Cloud.define("closeOpenedOrders", background.closeOpenedOrders);
Parse.Cloud.job("closeOpenedOrders", background.closeOpenedOrders);
