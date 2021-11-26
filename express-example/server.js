'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

// get the Queue-Fair library.
const queueFair = require('./queue-fair');

// You MUST use cookieParser or the adapter won't work.
app.use(cookieParser());

// set the view engine to ejs
app.set('view engine', 'ejs');

/** Convenience method so you can call it from any route.
 * MUST be called with await from inside an async function
 * as showin in get('/') below.
 * @param {Object} req an Express request
 * @param {Object} res an Express response
 * @return {boolean} whether or not execution of the page should continue.
 */
async function goQueueFair(req, res) {
  queueFair.config.account='DELETE AND REPLACE WITH ACCOUNT SYSTEM NAME';
  queueFair.config.accountSecret='DELETE AND REPLACE WITH ACCOUNT SECRET';

  // Comment out the below for production.  Can also be set to
  // a single IP address.
  queueFair.config.debug=true;

  // The service encapsulates Express low-level calls.
  // If you are not using Express, you will need to modify
  // QueueFairService to fit your framework.
  const service = queueFair.service(req, res);

  // The adapter does everything.  It must have confguration and a service.
  const adapter = queueFair.adapter(queueFair.config, service);

  // If your webserver is behind a Proxy or CDN you may need to edit
  // the following. The value needs to be the same as what a visitor
  // sees in their browser, including any query string.
  adapter.url = req.protocol + '://' + req.get('host') + req.originalUrl;

  // You must also set adapter.userAgent - if your webserver is
  // behind a proxy or CDN you might need to change this.
  adapter.userAgent = req.headers['user-agent'];

  // To run the full adapter process:
  if (!await adapter.go()) {
    // Adapter says No - do not generate page.
    return false;
  }

  // Page should continue.
  return true;
}

// index page
app.get('/', async function(req, res) {
  // note the word 'async' above! goQueuFair() and adapter.go()
  // below won't work without it, and no-one will ever be queued!
  // If you can't use async functions in your framework, you will
  // have to use the alternate method in get('/about') below.

  // Using await means that the response to this request won't be
  // sent to the browser until the Queue-Fair adapter process
  // has finished.  Express fully supports this.  If you are not
  // using express your webserver should still be able to serve
  // other requests while this one is waiting but you may
  // need to test this on your set-up to be sure.
  if (!await goQueueFair(req, res)) {
    // Adapter says do not generate this page.
    return;
  }

  // Normal page execution continues here.
  res.render('pages/index');
});

// The below code shows how to use the adapter if you can't use an#
// async function as above. You will need to set up a cron job to
// download your Queue-Fair account settings from
// https://files.queue-fair.net/account_name/account_secret/queue-fair-settings.json
// every five minutes and save them to a file.  Then use the following:
const fs = require('fs'); // Required so you can read files.

// about page
app.get('/about', function(req, res) {
  try {
    queueFair.config.account='DELETE AND REPLACE WITH ACCOUNT SYSTEM NAME';
    queueFair.config.accountSecret='DELETE AND REPLACE WITH ACCOUNT SECRET';

    // comment out the below for production.  Can also be set to
    // a single IP address.
    queueFair.config.debug=true;

    const service = queueFair.service(req, res);
    const adapter = queueFair.adapter(queueFair.config, service);
    adapter.url = req.protocol + '://' + req.get('host') + req.originalUrl;
    adapter.userAgent = req.headers['user-agent'];

    // Read the file.
    const settings=fs.readFileSync('/path/to/saved/settings.json');

    // Only simple mode can run in JavaScript without async.
    if (!adapter.goSimpleModeWithSettings(settings)) {
      return;
    }

    /* If you JUST want to validate a cookie (Hybrid Security Model)
     * then use the following instead of the call to adapter.go() or
     * adapter.goSimpleModeWithSettings() - no settings required. */
    /*
    if(adapter.url.indexOf("/path/to/order/page") != -1) {
      const passedLifetimeMinutes = 60;
      if(!adapter.validateCookie("queue_secret_from_portal",
        passedLifetimeMinutes,
        service.getCookie('QueueFair-Pass-' + "queue_name_from_portal"))) {
        //Cookie was not present or invalid.
        service.redirect("https://account_name.queue-fair.net/queue_name?qfError=InvalidCookie");
        return;
      }
    }
    */
  } catch (err) {
    // Probably your settings file does not exist.
    console.log('Error caught '+err);
    // In case of error, continue with the page.
  }

  // Normal page execution continues here.
  res.render('pages/about');
});

const port = 3001;
app.listen(port);
console.log('Server is listening on port '+port);
