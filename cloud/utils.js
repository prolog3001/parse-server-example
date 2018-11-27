const AWS = require('aws-sdk');
const sharp = require('sharp');
const Buffer = require('buffer').Buffer;
const moment = require('moment-timezone');
const geoTz = require('geo-tz');

module.exports = {
  uploadImage,
  dateDSTPresenter,
  dateDSTBeforeSessionSave,
  decodeBase64Image,
  getPricesAccordingToCommission,
  getNetPriceAfterCommission,
  calculateTeacherNetPrice,
  calculateStudentNetPayment,
  getTotalPriceIncludingCommission,
  checkIfSplashSeller,
  getRegaxCurrencySign,
  checkIfDollar,
  replaceAll
}

function uploadImage(request, response) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID, // this needs to move somewhere else!
  });
  var params = request.params;
  var {
    fileDataBase64,
    imageType
  } = params;
  //var imageBuffer = new Buffer(fileDataBase64, 'base64');
  var imageBufferData = decodeBase64Image(fileDataBase64);

  if (imageType < 3) {
    console.log("Resizing Image...");
    // 		imageBuffer = sharp(imageBuffer).resize(400, 400).max();
    imageBufferData.data = sharp(imageBufferData.data).resize(400, 400).max();
  } else {
    imageBufferData.data = sharp(imageBufferData.data).resize(600, 600).max();
  }

  var d = new Date();
  var imageName = d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes() + '_' + d.getSeconds();
  var bucketName
  var fileSuffix;
  switch (imageType) {
    case 0: //Profile
    bucketName = "medidate.profile.images";
    fileSuffix = "_medidate_profile";
    break;
    case 1: //Certificate
    bucketName = "medidate.certificate.images";
    fileSuffix = "_medidate_certificate";
    break; //imageType
    case 2: //Session Image
    bucketName = "medidate.session.images";
    fileSuffix = "_medidate_session";
    break;
    case 3: //Social ID
    bucketName = "medidate.documents.sellers";
    fileSuffix = "_medidate_social_id";
    break;
    case 4: //Bank Proof - Canceled Check
    bucketName = "medidate.documents.sellers";
    fileSuffix = "_medidate_bank_proof";
    break;
    case 5:
    bucketName = "medidate.documents.sellers";
    fileSuffix = "_medidate_incorporation";
    break;
    default:
    console.log("#### Bucket Type is missing");
    bucketName = "medidate.profile.images";
    fileSuffix = "_medidate_default";
    break;
  }
  var awsParams = {
    ACL: "public-read",
    Body: imageBufferData.data,
    Bucket: bucketName,
    Key: imageName + fileSuffix + ".jpg",
    ContentType: imageBufferData.type,
    ServerSideEncryption: "AES256",
  };


  new AWS.S3().upload(awsParams, function (err, data) {
    // console.log(data);
    if (err) {
      response.error(err)
      return;
    } else
    response.success(data.Location);

  });
}

function decodeBase64Image(dataString) {
  //   console.log("THE IMAGE DATA: " + dataString);
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
  response = {};

  if (matches === null || matches === undefined) {
    response.type = "image/jpeg";
    response.data = new Buffer(dataString, 'base64');
    return response;
  }

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

function getPricesAccordingToCommission(request, response) {
  var params = request.params;
  var count = !params.count ? 1 :  params.count;
  var price = params.price;
  var teacherId = params.teacherId;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("objectId", teacherId);
  userQuery.include("preferences");
  userQuery.find({
    success: function (users) {
      try {
        var teacherGotPaid = users[0];
        var prices = [];
        var priceSubstractCommision = calculateTeacherNetPrice(count, price, teacherGotPaid);
        var priceIncludingCommision = calculateStudentNetPayment(count, price, teacherGotPaid);
        console.log('priceSubstractCommision ', priceSubstractCommision)
        console.log('priceIncludingCommision ', priceIncludingCommision)
        prices.push(priceSubstractCommision);
        prices.push(priceIncludingCommision);
        response.success(prices);
      } catch (error) {
        console.log(error);
        response.error(error);
      }
    },
    error: function (error) {
      response.error(error);
    }
  });
}

function getNetPriceAfterCommission(request, response) {
  var params = request.params;
  var count = !params.count ? 1 :  params.count;
  var price = params.price;
  var teacherId = params.teacherId;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("objectId", teacherId);
  userQuery.include("preferences");
  userQuery.find({
    success: function (users) {
      try {
        var teacherGotPaid = users[0];
        var netPrice = calculateTeacherNetPrice(count, price, teacherGotPaid);
        response.success(netPrice);
      } catch (error) {
        console.log(error);
        response.error(error);
      }
    },
    error: function (error) {
      response.error(error);
    }
  });
}

function calculateTeacherNetPrice(count, price, teacherGotPaid) {
  try {
    console.log("Price to Get Before Fee - " + price);

    var netPrice;
    var merchantFeePercent;
    var serviceFeePercent;
    var serviceFeeCents;

    var isInDollars = checkIfSplashSeller(teacherGotPaid);

    try {
      if (teacherGotPaid.get("preferences") &&
      teacherGotPaid.get("preferences") !== null) {
        merchantFeePercent = teacherGotPaid.get("preferences").get("merchant_fee_percent") / 100;//2%
        serviceFeePercent = teacherGotPaid.get("preferences").get("payment_service_fee_percent") / 100;//2.9% or 2.6% or 2.1%
        serviceFeeCents = teacherGotPaid.get("preferences").get("payment_service_fee_cents") / 100;//1.2 ₪  or 0.3$
      } else {
        if (!isInDollars) {
          merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
          serviceFeePercent = process.env.PAYME_TOTAL_FEE_PERC / 100;//2.4%
          serviceFeeCents = process.env.PAYME_FEE_CENT / 100; //1.2 ₪ 
        } else {
          merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
          serviceFeePercent = process.env.SPLASH_TOTAL_FEE_PERC / 100;//2.9%
          serviceFeeCents = process.env.SPLASH_FEE_CENT / 100; //0.3$
        }
      }
    } catch (error) {
      if (!isInDollars) {
        serviceFeePercent = process.env.PAYME_TOTAL_FEE_PERC / 100;//2.6% or 2.1%
        merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
        serviceFeeCents = process.env.PAYME_FEE_CENT / 100; //1.2 ₪ 
      } else {
        serviceFeePercent = process.env.SPLASH_TOTAL_FEE_PERC / 100;//2.9%
        merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
        serviceFeeCents = process.env.SPLASH_FEE_CENT / 100; //0.3$
      }
    }

    netPrice = price * (1 - merchantFeePercent);

    netPrice = netPrice.toFixed(2);
    console.log("Price to Get After Fee - " + netPrice);
    return netPrice * count;
  } catch (error) {
    console.log(error);
    return price;
  }
}

function getTotalPriceIncludingCommission(request, response) {
  var params = request.params;
  var count = !params.count ? 1 : params.count;
  var price = params.price;
  var teacherId = params.teacherId;

  var userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("objectId", teacherId);
  userQuery.include("preferences");
  userQuery.find({
    success: function (users) {
      try {
        var teacherGotPaid = users[0];
        var netPayment = calculateStudentNetPayment(count, price, teacherGotPaid);
        response.success(netPayment);
      } catch (error) {
        console.log(error);
        response.error(error);
      }
    },
    error: function (error) {
      response.error(error);
    }
  });
}

function calculateStudentNetPayment(count, price, teacherGotPaid) {
  try {
    console.log("Price to Pay Before Xd - " + price);
    //formula for calculating the price a student should pay for the teacher
    //so the teacher will get 0.98% of his price
    var Xd;
    var totalFeeMultiplier;
    var totalWantedPriceFeeMultiplier;

    var netPrice;
    var totalFeePercentage;
    var merchantFeePercent;
    var serviceFeePercent;
    var serviceFeeCents;

    var isInDollars = checkIfSplashSeller(teacherGotPaid);

    try {
      if (teacherGotPaid.exists("preferences") && teacherGotPaid.get("preferences") &&
      teacherGotPaid.get("preferences") !== null) {
        merchantFeePercent = teacherGotPaid.get("preferences").get("merchant_fee_percent") / 100;//2%
        serviceFeePercent = teacherGotPaid.get("preferences").get("payment_service_fee_percent") / 100;//2.9% or 2.6% or 2.1%
        serviceFeeCents = teacherGotPaid.get("preferences").get("payment_service_fee_cents") / 100;//1.2 ₪  or 0.3$
      } else {
        if (!isInDollars) {
          serviceFeePercent = process.env.PAYME_TOTAL_FEE_PERC / 100;//2.6% or 2.1%
          merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
          serviceFeeCents = process.env.PAYME_FEE_CENT / 100; //1.2 ₪ 
        } else {
          serviceFeePercent = process.env.SPLASH_TOTAL_FEE_PERC / 100;//2.9%
          merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
          serviceFeeCents = process.env.SPLASH_FEE_CENT / 100; //0.3$
        }
      }

    } catch (error) {
      if (!isInDollars) {
        serviceFeePercent = process.env.PAYME_TOTAL_FEE_PERC / 100;//2.6% or 2.1%
        merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
        serviceFeeCents = process.env.PAYME_FEE_CENT / 100; //1.2 ₪ 
      } else {
        serviceFeePercent = process.env.SPLASH_TOTAL_FEE_PERC / 100;//2.9%
        merchantFeePercent = process.env.MERCHANT_FEE_PERC / 100;//2%
        serviceFeeCents = process.env.SPLASH_FEE_CENT / 100; //0.3$
      }
    }

    totalFeePercentage = serviceFeePercent + merchantFeePercent; //6% --> 0.06 or 5.9% --> 0.059 for Splash
    totalFeeMultiplier = 1 - totalFeePercentage;
    console.log("totalFeeMultiplier - " + totalFeeMultiplier);

    totalWantedPriceFeeMultiplier = 1 - merchantFeePercent;
    console.log("totalWantedPriceFeeMultiplier - " + totalWantedPriceFeeMultiplier);

    console.log("serviceFeeCents - " + serviceFeeCents);

    //The formula is:
    //FEE_PERC can be PAYME_TOTAL_FEE_PERC or SPLASH_TOTAL_FEE_PERC
    //(price + Xd)(1 - totalFeePercentage) - serviceFeeCents = price * (1 - serviceFeePercent)
    //Xd = 0.032*price + 0.32 for that to happen

    Xd = (price * (totalWantedPriceFeeMultiplier - totalFeeMultiplier) + (serviceFeeCents) / totalFeeMultiplier);
    netPrice = price + Xd;
    netPrice = netPrice.toFixed(2);
    console.log("Price to Pay After Xd - " + netPrice);
    return netPrice * count;
  } catch (error) {
    console.log(error);
    return price;
  }
}

function checkIfSplashSeller(parseUser) {
  try {
    if (parseUser.get("splash_seller_id") === null || parseUser.get("splash_seller_id") === undefined) {
      console.log("not splash seller");
      return false;
    }

    if (parseUser.get("splash_seller_id").length == 0) {
      console.log("not splash seller");
      return false;
    }

    console.log("sellerInSplash - " + true);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function getRegaxCurrencySign(seller, objectToPay) {
  try {
    console.log("getRegaxCurrencySign");

    var currencySign;

    if (objectToPay && objectToPay !== null && objectToPay.exists("currency")) {
      if (objectToPay.get("currency") === "USD") {
        currencySign = "\\" + "$";
      } else {
        currencySign = "₪";
      }
    } else {
      if (checkIfDollar(seller)) {
        currencySign = "\\" + "$";
      } else {
        currencySign = "₪";
      }
    }

    console.log("currencySign - " + currencySign);
    return currencySign;
  } catch (error) {
    console.log(error);
    return "\\" + "$";
  }
}

function checkIfDollar(seller) {
  try {
    if (seller === null || seller === undefined) {
      console.log("notDollar - " + "seller is null");
      return true;
    }

    if (seller.get("bank_country") === null || seller.get("bank_country") === undefined) {
      console.log("notDollar - " + "bank_country is null");
      return true;
    }

    if (seller.get("bank_country").length == 0) {
      console.log("notDollar - " + "bank_country is empty");
      return true;
    }

    if (seller.get("bank_country") == "Israel") {
      console.log("notDollar - " + "bank_country is Israel");
      return false;
    }

    console.log("notDollar - " + true);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function replaceAll(str, find, replace) {
  if (str === undefined || str.length == 0)
  return str;
  if (find === undefined || find.length == 0)
  return str;
  if (replace === undefined || replace.length == 0)
  return str;

  //     console.log("replaceAll");
  //     console.log("find - " + find);
  //     console.log("replace - " + replace);
  return str.replace(new RegExp(find, 'g'), replace);
  //     return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function dateDSTPresenter(request, response) {
  var params = request.params;

  var date = params.date;
  var timezone = params.timezone;

  response.success(dateAddDaylightSavingIfNeeded(date,timezone));
}

function dateDSTBeforeSessionSave(request, response) {
  var params = request.params;

  var date = params.date;
  var timezone = params.timezone;

  response.success(dateSubtractDaylightSavingIfNeeded(date,timezone));
}

function dateAddDaylightSavingIfNeeded(date,tz) {
  try {

    var isInDaylightSaving = moment.tz(date, tz).isDST();
    if(!isInDaylightSaving)
    {
      var daylightSavingOffsetForTimezone = getDSTBias(tz);
      console.log("Date " + date + " at TimeZone " + tz + " is in Daylight Saving " + isInDaylightSaving + " With offset" + getDSTBias(tz));


      var dateWithDaylightSavingAdded = moment.tz(date, tz).add(daylightSavingOffsetForTimezone, 'minutes').toDate();
      console.log("Date " + date + " After Daylight Saving " + dateWithDaylightSavingAdded);
      return dateWithDaylightSavingAdded;

    }else {
      console.log("Date " + date + " at TimeZone " + tz + " is in Daylight Saving " + isInDaylightSaving);
      return date;
    }
  } catch (error) {
    console.log(error);
    return date;
  }
}

function dateSubtractDaylightSavingIfNeeded(date,tz) {
  try {

    var isInDaylightSaving = moment.tz(date, tz).isDST();
    if(!isInDaylightSaving)
    {
      var daylightSavingOffsetForTimezone = getDSTBias(tz);
      console.log("Date " + date + " at TimeZone " + tz + " is in Daylight Saving " + isInDaylightSaving + " With offset" + getDSTBias(tz));
      var dateWithDaylightSavingSubtracted = moment.tz(date, tz).subtract(daylightSavingOffsetForTimezone, 'minutes').toDate();
      return dateWithDaylightSavingSubtracted;
    }else {
      console.log("Date " + date + " at TimeZone " + tz + " is in Daylight Saving " + isInDaylightSaving);
      return date;
    }

  } catch (error) {
    console.log(error);
    return false;
  }
}

function getDSTBias(tz) {
  var janOffset = moment.tz({month: 0, day: 1}, tz).utcOffset();
  var junOffset = moment.tz({month: 5, day: 1}, tz).utcOffset();
  console.log("Offset for TimeZone " + tz + " is " + Math.abs(junOffset - janOffset));
  return Math.abs(junOffset - janOffset);
}

function convertSessionDateAccordingToTimezone(session) {
  var timezone = geoTz(session.get("location").latitude, session.get("location").longitude);
  return date = moment.tz(session.get("date"), timezone).toDate();
}

function convertDateAccordingToLatLong(date,lat,long) {
  var timezone = geoTz(lat, long);
  return date = moment.tz(date, timezone).toDate();
}
