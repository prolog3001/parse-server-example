var push = require('./push.js');
var i18n = require('i18n');
var utils = require('./utils.js');
const axios = require('axios');
var request = require("request");
var http = require("https");

const CONTACT_TYPES = {
  Users_Admin: '13bce981-1bec-46f4-8bed-33fe99c64c26',
  Users_Planner: '9e0ae9bd-e366-480c-b91a-a0d6a1f0f4f2',
  Users_Client: '322fb624-e73a-4bd5-b0c5-c62b30fd0366'
}

module.exports = {
  addUserToMailingList,
  sendNewHostEmail: function (request, response) {
    sendNewHostEmail(request, response);
  },
  sendTestEmail: function (request, response) {
    sendTestEmail(request, response);
  },
  sendNewsletter: function (request, response) {
    sendNewsletter(request, response);
  },
  sendBulkEmail: function (request, response) {
    sendBulkEmail(request, response);
  },
  CONTACT_TYPES
};

function addUserToMailingList(user, type) {
  try {
    var listIds = [];

    if (!user || !user.email) {
      console.log('addUserToMailingList', 'dummy user')
      user = {
        email: "matandahan@gmail.com",
        name: 'Matan'
      }
    }

    if (!type || !type.length)
      type = CONTACT_TYPES['Users_Planner'];

    listIds.push(type)

    console.log('addUserToMailingList user', user)

    var email = (user.email ? user.email : user.get('email'));
    var name = (user.name ? user.name : user.get('name'));

    console.log('addUserToMailingList', email)
    console.log('addUserToMailingList', name)

    var auth = "Bearer " + process.env.SENDGRID_API_KEY;
    // console.log('addUserToMailingList auth', auth)

    var options = {
      method: 'PUT',
      url: 'https://api.sendgrid.com/v3/marketing/contacts',
      headers:
      {
        'content-type': 'application/json',
        authorization: auth
      },
      body:
      {
        list_ids: listIds,
        contacts:
          [
            {
              'email',
              'first_name': name
            }
          ]
      },
      json: true
    };
    console.log('addUserToMailingList options', options)

    request(options, function (error, response, body) {
      if (error) {
        console.log('addUserToMailingList error', error)
      }

      console.log('addUserToMailingList success', body);
    });
  } catch (error) {
    console.error('addUserToMailingList', error)
  }
}

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
      to: process.env.MAILGUN_TEST_EMAIL,
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

      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(data)
        .then(() => {
          console.log('Email sent')
        }).catch((error) => {
          console.error(error)
        })
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
    // console.log("sendBulkEmail..." + emailBody);
    if (!users || users.length == 0) {
      console.log("sendBulkEmail dummy");
      // return;
    } else {
      console.log("sendBulkEmail..." + users.length);
    }

    var fromEmail = "info@dreamdiner.io";
    var fromName = "DreamDiner";

    var recipients = [];

    if (!emailSubject || !emailSubject.length) {
      emailSubject = "Welcome to DreamDiner";
    }

    if (!emailBody || !emailBody.length) {
      var fs = require('fs');
      emailBody = fs.readFileSync('cloud/HTML/User Actions/email_welcome.html', "utf-8");
      emailBody = utils.replaceAll(emailBody, "admin_name", "DreamDiner Test");
    }

    if (!users || !users.length) {
      recipients.push('matan1@mailinator.com')
      recipients.push('matan2@mailinator.com')
      recipients.push('matan3@mailinator.com')
      recipients.push('matan4@mailinator.com')
    } else {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var recepient = user.get("email");
        recipients.push(recepient);
      }
    }

    console.log("bulk email fromEmail", fromEmail);
    console.log("bulk email recipients", recipients);
    console.log("bulk email emailSubject", emailSubject);
    var data = {
      from: fromEmail,
      to: recipients,
      subject: emailSubject,
      html: emailBody
    };
    console.log("bulk email data", data);

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sgMail.sendMultiple(data)
      .then(() => {
        console.log("bulk email sent");
      }).catch((error) => {
        console.log("got an error in sendBulkEmail: " + error);
      })

    // var simpleMailgunAdapter = require('mailgun-js')({
    //   apiKey: process.env.MAILGUN_KEY || '',
    //   domain: process.env.MAILGUN_DOMAIN
    // });

    // for (var i = 0; i < users.length; i++) {
    //   var user = users[i];

    //   var recepient = user.get("email");
    //   var recepientVar = {
    //     id: user.id,
    //     subject: emailSubject,
    //     name: user.get("name")
    //   };

    //   recipients.push(recepient);
    //   recipientVars[recepient] = recepientVar;
    // }

    // var envelope = {
    //   from: fromString,
    //   to: recipients,
    //   subject: '%recipient.subject%',
    //   html: emailBody,
    //   'recipient-variables': recipientVars,
    // };

    // simpleMailgunAdapter.messages().send(envelope, function (error, body) {
    //   if (error) {
    //     console.log("got an error in sendBulkEmail: " + error);
    //     return error;
    //   } else {
    //     console.log("bulk email sent");
    //     return "bulk email sent";
    //   }
    // });
  } catch (error) {
    console.log(error);
    return error;
  }
}
