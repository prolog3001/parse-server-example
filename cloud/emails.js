var push = require('./push.js');
var i18n = require('i18n');
var utils = require('./utils.js');

module.exports = {
  sendNewHostEmail: function (request, response) {
    sendNewHostEmail(request, response);
  },
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

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sgMail.send(data)
      .then(() => {
        console.log('Email sent')
      }).catch((error) => {
        console.error(error)
      })
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function sendNewHostEmail(request, response) {
  try {
    var params = request.params;

    var user = await utils.getObjectById('User', params.userId);
    console.log("New User id: " + user.id);
    console.log("New User name: " + user.get("name"));
    console.log("New User email: " + user.get("email"));

    if (user.get("name") && user.get("name").length > 0 &&
      user.get("email") && user.get("email").length > 0) {

      console.log("New Host has email and name");

      var fromEmail = "info@dreamdiner.io";
      var fromName = "DreamDiner";
      var fromString = fromName + " <" + fromEmail + ">";

      var toString = user.get("name") + " <" + user.get("email") + ">"

      var emailSubject = "Welcome to the Table Planner";

      var fs = require('fs');
      var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_host_added.html', "utf-8");
      emailBody = utils.replaceAll(emailBody, "admin_name", user.get("name"));

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
          console.log("email sent to " + user.get("email"));
          return;
        }
      });
    } else {
      console.log("New User has NO email and name");
    }
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
    userQuery.exists("business");
    userQuery.exists("email");
    userQuery.notEqualTo("blocked", true);

    //DEBUG ONLY
    userQuery.equalTo("email", process.env.MAILGUN_TEST_EMAIL);
    userQuery.limit(1);

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
    // console.log("sendBulkEmail..." + emailBody);
    if (users.length == 0) {
      console.log("sendBulkEmail cancel");
      return;
    }

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
