const AWS = require('aws-sdk');
const sharp = require('sharp');
const Buffer = require('buffer').Buffer;
const moment = require('moment-timezone');
const geoTz = require('geo-tz');

module.exports = {
  sendSMS,
  getObjectById,
  getUserByPhone,
  getObjectByIdWithInclude,
  getObjectByIdIncludes,
  uploadImage,
  dateDSTPresenter,
  dateDSTBeforeSessionSave,
  decodeBase64Image,
  removeDuplicatesByKey,
  getObjectById,
  getObjectsInRelation,
  getRegaxCurrencySign,
  checkIfDollar,
  replaceAll,
  removeDuplicatesByKey,
  saveBuyerKeyToUser
}

function sendSMS(request, response) {
  let {to, from, text} = request.params;
  console.log("Send SMS:" + text);
  console.log("Send SMS to:" + to);
  console.log("Send SMS from:" + from);

  const Nexmo = require('nexmo')
  const nexmo = new Nexmo({
    apiKey: '0d809a59',
    apiSecret: '8beb9f6d5f3f1637'
  })

  if(!from || from == null || from.length == 0)
  from = 'DreamDiner'

  nexmo.message.sendSms(
    from, to, text, {type: 'unicode'},
    (err, responseData) => {
      if (err) {
        console.log(err);
        response.error(err);
      } else {
        console.log("Sent SMS to:" + to);
        response.success("Sent SMS to:" + to);
      }
    }
  );
  return;
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

function removeDuplicatesByKey(keyToRemove, array) {
  var values = {};
  return array.filter(function (item) {
      var val = item[keyToRemove];
      var exists = values[val];
      values[val] = true;
      return !exists;
  });
}

function getObjectById(className, id, includes) {
  console.log("className", className);
  console.log("id", id);
  return new Promise((resolve, reject) => {
      var query = new Parse.Query(className);
      if (includes && includes.length > 0) {
          for (let i = 0; i < includes.length; i++) {
              const include = includes[i];
              console.log('include', include);
              query.include(include);
          }

      }
      query.equalTo('objectId', id);
      query.limit(1);
      query.find().then(function (res) {
          resolve(res[0]);
      }, function (err) {
          console.log('err when finding object', err)
          reject(err);
      });
  });
}

function getObjectsInRelation(relationObject, includes) {
  return new Promise((resolve, reject) => {
      var query = relationObject.query();
      if (includes && includes.length > 0) {
          for (let i = 0; i < includes.length; i++) {
              const include = includes[i];
              console.log('include', include);
              query.include(include);
          }

      }
      query.include('preferences');
      query.find().then(function (res) {
          resolve(res);
      }, function (err) {
          console.log('err when finding object', err)
          reject(err);
      });
  });
}

function getRegaxCurrencySign(seller, objectToPay) {
  try {
    console.log("getRegaxCurrencySign");

    var currencySign;

    if (objectToPay && objectToPay !== null && objectToPay.get("currency")) {
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

async function saveBuyerKeyToUser(phone, key) {
  var buyer = await getUserByPhone(phone);
  buyer.save({ 'payme_buyer_key': key }, { useMasterKey: true });
  console.log('Saved buyer key to user', buyer.id);
}

function getUserByPhone(phone, includes) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Parse.User);
    query.endsWith('username', phone.substring(phone.length - 5, phone.length));
    if (includes && includes.length > 0) {
      for (let i = 0; i < includes.length; i++) {
        const include = includes[i];
        console.log('include', include);
        query.include(include);
      }
    }
    query.limit(1);
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

function getObjectByIdWithInclude(className, includeField, id) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(className);
    query.equalTo('objectId', id);
    query.include(includeField);
    query.limit(1);
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

function getObjectByIdIncludes(className, id, includes) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(className);
    if (includes && includes.length > 0) {
      for (let i = 0; i < includes.length; i++) {
        const include = includes[i];
        console.log('include', include);
        query.include(include);
      }
    }
    query.equalTo('objectId', id);
    query.limit(1);
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

function removeDuplicatesByKey(keyToRemove, array) {
  var values = {};
  return array.filter(function(item){
    var val = item[keyToRemove];
    var exists = values[val];
    values[val] = true;
    return !exists;
  });
}
