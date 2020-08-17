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

    const recipients = ['email1@gmail.com', 'email2@gmail.com'];
    const recipientVars = {
      'email1@gmail.com': {
        id: 1,
        subject: 'Subject 1',
        name: 'Name 1'
      },
      'email2@gmail.com': {
        id: 2,
        subject: 'Subject 2',
        name: 'Name 2'
      }
    };

    const envelope = {
      from: 'Sender <sender@gmail.com>',
      to: recipients,
      subject: '%recipient.subject%',
      html: 'Hey <strong>%recipient.name%<strong>',
      'recipient-variables': recipientVars,
    };

    simpleMailgunAdapter.messages().send(envelope, function (error, body) {
      if (error) {
        console.log("got an error in sendBulkEmail: " + error);
        return;
      } else {
        console.log("bulk email sent to " + process.env.MAILGUN_TEST_EMAIL);
        return;
      }
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}
