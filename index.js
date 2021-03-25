var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var routes = require('./controllers/routes');
var bodyParser = require('body-parser');
var i18n = require('i18n');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
    console.log('Sandbox: DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: __dirname + '/cloud/main.js',
    appId: process.env.APP_ID,
    appName: 'DreamDiner Sandbox',
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
        classNames: ["Payment", "_User", "User", "Business", "Order",
            "RestaurantOrderSummary", "Table", "UserWaiterRelation"
        ] // List of classes to support for query subscriptions
    },
    emailAdapter: {
        module: '@parse/simple-mailgun-adapter',
        options: {
            fromAddress: process.env.MAILGUN_FROM_ADDRESS,
            apiKey: process.env.MAILGUN_KEY,
            domain: process.env.MAILGUN_DOMAIN
        }
    },
    // enableSingleSchemaCache: true
    //   push: {
    //      adapter: oneSignalPushAdapter
    //   }
});

var app = express();
app.use(cookieParser("DreamDiner Sandbox"));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(bodyParser.urlencoded({ extended: false }));
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
routes(app);

i18n.configure({
    locales: ['en', 'he'],
    directory: __dirname + '/cloud/locales',
    defaultLocale: 'en',
    cookie: 'i18n'
});

app.use(i18n.init);

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
    if (req.cookies.i18n == undefined)
        res.setLocale('en')
    else
        res.setLocale(req.cookies.i18n);

    res.render('main', { i18n: res })
    res.status(200).send('I dream of planning tables!');
});

app.get('/en', function (req, res) {
    res.cookie('i18n', 'en');
    res.redirect('/')
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

// Closing of opened orders
// setInterval(function() {
//     Parse.Cloud.run('closeOpenedOrders', {});
// }, 21600000); //6 * 60 * 60 * 1000)

// Deleting of TA tables
setInterval(function () {
    Parse.Cloud.run('deleteTATables', {});
}, 3600000); //60 * 60 * 1000)

// Daily New Users Report
// setInterval(function () {
// Parse.Cloud.run('reportDailyNewUsers', {});
// }, 86400000); //24 * 60 * 60 * 1000)

// Daily New Orders Report
// setInterval(function () {
// Parse.Cloud.run('reportDailyNewOrders', {});
// }, 86500000); //24 * 60 * 60 * 1000)

// Daily Delivered SMS Report
// setInterval(function () {
// Parse.Cloud.run('reportDailySMSSent', {});
// }, 86700000); //24 * 60 * 60 * 1000)

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,1,2,3,4,5,6];
rule.hour = 5;
rule.minute = 0;

const job = schedule.scheduleJob(rule, function () {
    console.log('Dreamdiner Cron Job at 23:00');
    Parse.Cloud.run('reportDaily', {});
});

