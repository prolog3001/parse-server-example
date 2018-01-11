var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');
var S3Adapter = require('parse-server-s3-adapter');

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

//Push Adapter
// var oneSignalPushAdapter = new OneSignalPushAdapter({
//   oneSignalAppId:process.env.ONE_SIGNAL_APP_ID,
//   oneSignalApiKey:process.env.ONE_SIGNAL_REST_API_KEY
// });

//Files Adapter
var s3Adapter = new S3Adapter(
  process.env.S3_ACCESS_KEY, 
  process.env.S3_SECRET_KEY, 
  process.env.S3_BUCKET, {
  region: 'us-east-1',
  bucketPrefix: '',
  directAccess: false,
  baseUrl: '',
  signatureVersion: 'v4',
  globalCacheControl: 'public, max-age=86400'  // 24 hrs Cache-Control.
});

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: __dirname + '/cloud/main.js',
  appId: process.env.APP_ID,
  appName: 'DigiDine Table Planner',
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,  // Don't forget to change to https if needed
  publicServerURL: process.env.PUBLIC_SERVER_URL,
  filesAdapter: s3Adapter,
  liveQuery: {
    classNames: ["User", "Business", "Order"] // List of classes to support for query subscriptions
  },
//   emailAdapter: {
//       module: 'parse-server-simple-mailgun-adapter',
//       options: {
//       fromAddress: process.env.MAILGUN_FROM_ADDRESS,
//       apiKey: process.env.MAILGUN_KEY,
//       domain: process.env.DOMAIN
//       }
//       },
//   push: {
//      adapter: oneSignalPushAdapter
//   }
});

var app = express();

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of planning tables!');
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
