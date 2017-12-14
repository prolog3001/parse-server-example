// Example express application adding the parse-server module to expose Parse
// compatible API routes.
// import OneSignalPushAdapter from __dirname + '/adapters/OneSignalPushAdapter';

var express = require('express');
var ParseServer = require('parse-server').ParseServer;

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

//Mailgun - reset password
// var simpleMailgunAdapter = require('parse-server/lib/Adapters/Email/SimpleMailgunAdapter')({
//   apiKey: process.env.MAILGUN_KEY || '',
//   domain: process.env.DOMAIN || 'medidatewith.me',
//   fromAddress: process.env.MAILGUN_FROM_ADDRESS || 'no-reply@medidatewith.me'
// });

//Push Adapter
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');
var oneSignalPushAdapter = new OneSignalPushAdapter({
  oneSignalAppId:process.env.ONE_SIGNAL_APP_ID,
  oneSignalApiKey:process.env.ONE_SIGNAL_REST_API_KEY
});

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  appName: 'Medidate Sandbox',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || process.env.ALT_SERVER_URL,  // Don't forget to change to https if needed
  publicServerURL: process.env.PUBLIC_SERVER_URL || process.env.ALT_PUBLIC_SERVER_URL,
  verifyUserEmails: true,
  emailAdapter: {
      module: 'parse-server-simple-mailgun-adapter',
      options: {
      fromAddress: process.env.MAILGUN_FROM_ADDRESS || 'no-reply@medidatewith.me',
      apiKey: process.env.MAILGUN_KEY || '',
      domain: process.env.DOMAIN || 'medidatewith.me',
      }
      },
  push: {
     adapter: oneSignalPushAdapter
  },
  liveQuery: {
    classNames: ["Message"] // List of classes to support for query subscriptions
  }
//    customPages: {
//      invalidLink: process.env.HOST_URL + 'invalid_link.html',
//      verifyEmailSuccess: process.env.HOST_URL + 'verify_email_success.html',
//      choosePassword: process.env.HOST_URL + 'choose_password.html',
//      passwordResetSuccess: process.env.HOST_URL + 'password_reset_success.html'
//    }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey
//-----------------REAL CODE-------------------//
// var app = express();

// // Serve the Parse API on the /parse URL prefix
// var mountPath = process.env.PARSE_MOUNT || '/parse';
// app.use(mountPath, api);

// // Parse Server plays nicely with the rest of your web routes
// app.get('/', function(req, res) {
//   res.status(200).send('I dream of killing some ZOMBIE ASS!');
// });

// var port = process.env.PORT || 1337;
// app.listen(port, function() {
//     console.log('parse-server-example running on port ' + port + '.');
// });

//-----------------REAL CODE-------------------//

//-----------------TEST CODE-------------------//
var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
//-----------------TEST CODE-------------------//
