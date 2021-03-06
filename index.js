var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var routes = require('./controllers/routes');
var bodyParser = require('body-parser');
var utils = require('./cloud/utils');
var i18n = require('i18n');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');

global.lastSentDailyReportEmail = undefined;
var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
    // console.log('Sandbox: DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: __dirname + '/cloud/main.js',
    appId: process.env.APP_ID,
    appName: 'DreamDiner',
    verifyUserEmails: true,
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
app.use(cookieParser("DreamDiner"));

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


//Keep server alive hack
setInterval(function () {
    console.log('keep server alive');
}, 3500000); //60 * 60 * 1000)//less then an hour


// Deleting of TA tables
// setInterval(function () {
//     Parse.Cloud.run('deleteTATables', {});
// }, 3600000); //60 * 60 * 1000)



// const rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = [0,1,2,3,4,5,6];
// rule.hour = 4;
// rule.minute = 59;

// let time = [
//     '0'/*seconds*/,
//     '00'/*min*/,
//     '21'/*hours*/,
//     '*'/*days*/,
//     '*'/*month*/,
//     '*'/*day of week*/
// ].join(' '); // every minute multiple of 5

// const job = schedule.scheduleJob(time, function () {
//     console.log('Dreamdiner Cron Job at 23:00');
//     Parse.Cloud.run('reportDaily', {});
// });
randomTick(() => Parse.Cloud.run('reportDaily', {}), 80000000, 90000000);   // 

function randomTick(func, min, max) {
    setTimeout(() => {
      func();
      randomTick(func, min, max);  // set up the next tick
    }, utils.randomIntFromInterval(min, max));
  }

