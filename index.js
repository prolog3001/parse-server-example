var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');
// var S3Adapter = require('@parse/s3-files-adapter');

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: __dirname + '/cloud/main.js',
    appId: process.env.APP_ID,
    appName: 'DigiDine Table Planner',
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL, // Don't forget to change to https if needed
    publicServerURL: process.env.PUBLIC_SERVER_URL,
    filesAdapter: {
        module: "@parse/s3-files-adapter",
        options: {
            bucket: process.env.S3_BUCKET,
            region: 'us-east-1', // default value
            bucketPrefix: '', // default value
            directAccess: false, // default value
            baseUrl: null, // default value
            baseUrlDirect: false, // default value
            signatureVersion: 'v4', // default value
            globalCacheControl: null, // default value. Or 'public, max-age=86400' for 24 hrs Cache-Control
            ServerSideEncryption: 'AES256|aws:kms' //AES256 or aws:kms, or if you do not pass this, encryption won't be done
        }
    },
    liveQuery: {
        classNames: ["User", "Business", "Order",
            "RestaurantOrderSummary", "Table", "UserWaiterRelation"
        ] // List of classes to support for query subscriptions
    },
    emailAdapter: {
        module: '@parse/simple-mailgun-adapter',
        options: {
            fromAddress: process.env.MAILGUN_FROM_ADDRESS,
            apiKey: process.env.MAILGUN_KEY,
            domain: process.env.DOMAIN
        }
    },
    // enableSingleSchemaCache: true
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

// Re-Occuring of sessions
setInterval(function() {
    Parse.Cloud.run('closeOpenedOrders', {});
}, 300000); //5 * 60000)
