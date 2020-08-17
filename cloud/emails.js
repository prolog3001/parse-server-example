var push = require('./push.js');
var i18n = require('i18n');
var utils = require('./utils.js');

module.exports = {
  sendTestEmail: function (request, response) {
    sendTestEmail(request, response);
  },
  sendNewsletter: function (request, response) {
    sendNewsletter(request, response);
  }
};

async function sendTestEmail(request, response) {
  try {
    var params = {};

    var fromEmail = "info@dreamdiner.io";
    var fromName = "DreamDiner";
    var fromString = fromName + " <" + fromEmail + ">";

    var toString = "DreamDiner Test" + " <" + process.env.MAILGUN_TEST_EMAIL + ">"

    var emailSubject = "Welcome to DreamDiner";

    var fs = require('fs');
    var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_welcome.html', "utf-8");
    emailBody = utils.replaceAll(emailBody, "admin_name", "DreamDiner Test");

    var data = {
      from: fromString,
      to: toString,
      subject: emailSubject,
      html: emailBody
    };

    var simpleMailgunAdapter = require('mailgun-js')({
      apiKey: process.env.MAILGUN_KEY || '',
      domain: process.env.MAILGUN_DOMAIN
    });

    simpleMailgunAdapter.messages().send(data, function (error, body) {
      if (error) {
        console.log("got an error in sendEmail: " + error);
        return;
      } else {
        console.log("email sent to " + process.env.MAILGUN_TEST_EMAIL);
        return;
      }
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function sendNewsletter(request, response) {
  try {
    var fs = require('fs');
    var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_newsletter.html', "utf-8");

    var userQuery = new Parse.Query(Parse.User);
    userQuery.exists("email");
    userQuery.notEqualTo("blocked", true);

    //DEBUG ONLY
    userQuery.equalTo("email", process.env.MAILGUN_TEST_EMAIL);

    userQuery.limit(1000);
    userQuery.find({
      useMasterKey: true,
      success: function (users) {
        console.log("Found..." + users.length);
        sendBulkEmail("Test Newsletter", emailBody, users);
        if (response)
          response.success("Newsletter Sent");
        else
          return;
      },

      error: function (error) {
        if (response)
          response.error(error);
        else
          return error;
      }
    });
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    else
      return error;
  }
}

async function sendBulkEmail(emailSubject, emailBody, users) {
  try {
    console.log("sendBulkEmail..." + users.length);
    console.log("sendBulkEmail..." + emailBody);

    var fromEmail = "info@dreamdiner.io";
    var fromName = "DreamDiner";
    var fromString = fromName + " <" + fromEmail + ">";

    var simpleMailgunAdapter = require('mailgun-js')({
      apiKey: process.env.MAILGUN_KEY || '',
      domain: process.env.MAILGUN_DOMAIN
    });

    var recipients = [];
    var recipientVars = {};

    for (var i = 0; i < users.length; i++) {
      var user = users[i];

      var recepient = user.get("email");
      var recepientVar = {
        id: user.id,
        subject: emailSubject,
        name: user.get("name")
      };

      recipients.push(recepient);
      recipientVars[recepient] = recepientVar;
    }

    var envelope = {
      from: fromString,
      to: recipients,
      subject: '%recipient.subject%',
      html: emailBody,
      'recipient-variables': recipientVars,
    };

    simpleMailgunAdapter.messages().send(envelope, function (error, body) {
      if (error) {
        console.log("got an error in sendBulkEmail: " + error);
        return error;
      } else {
        console.log("bulk email sent");
        return "bulk email sent";
      }
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}
