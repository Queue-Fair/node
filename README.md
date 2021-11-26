---
## Queue-Fair Virtual Waiting Room Node.js & Server-Side JavaScript Adapter README & Installation Guide

Queue-Fair can be added to any web server easily in minutes.  You will need a Queue-Fair account - please visit https://queue-fair.com/free-trial if you don't already have one.  You should also have received our Technical Guide.

## Client-Side JavaScript Adapter

Most of our customers prefer to use the Client-Side JavaScript Adapter, which is suitable for all sites that wish solely to protect against overload.

To add the Queue-Fair Client-Side JavaScript Adapter to your web server, you don't need the Node.js files included in this extension.

Instead, add the following tag to the `<head>` section of your pages:
 
```
<script data-queue-fair-client="CLIENT_NAME" src="https://files.queue-fair.net/queue-fair-adapter.js"></script>`
```

Replace CLIENT_NAME with the account system name visibile on the Account -> Your Account page of the Queue-Fair Portal

You shoud now see the Adapter tag when you perform View Source after refreshing your pages.

And you're done!  Your queues and activation rules can now be configured in the Queue-Fair Portal.

## Server-Side Adapter

The Server-Side Adapter means that your web server communicates directly with the Queue-Fair servers, rather than your visitors' browsers.

This can introduce a dependency between our systems, which is why most customers prefer the Client-Side Adapter.  See Section 10 of the Technical Guide for help regarding which integration method is most suitable for you.

The Server-Side Adapter is a small Node.js library that will run when visitors access your site.  It periodically checks to see if you have changed your Queue-Fair settings in the Portal, and caches the result in memory, but other than that if the visitor is requesting a page that does not match any queue's Activation Rules, it does nothing.

If a visitor requests a page that DOES match any queue's Activation Rules, the Adapter consults the Queue-Fair Queue Servers to make a determination whether that particular visitor should be queued.  If so, the visitor is sent to our Queue Servers and execution and generation of the page for that HTTP request for that visitor will cease.  If the Adapter determines that the visitor should not be queued, it sets a cookie to indicate that the visitor has been processed and your page executes and shows as normal.

Thus the Server-Side Adapter prevents visitors from skipping the queue by disabling the Client-Side JavaScript Adapter, and also reduces load on your web server when things get busy.

These instructions assume you already have a Node.js webapp using Express .  The example code in this distribution also uses EJS but you don't have to use it - it's just for demonstration purposes.  If you are setting up an Express webapp for the first time, or want to run the example code, follow the turtorial at https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application - you only need to do Step 1 of the tutorial.

If you are not using Express, you can still use the example code in `server.js` from this distribution - but you will also need to implement your own QueueFairService class to encapsulate your alternative HTTP framework.  It's only five basic methods to write.

Here's how to add Queue-Fair to your Node.js project.

**1.** Copy the queue-fair folder from this distribution somwhere into your webapp folder heirarchy.  It can go anywhere.  The example code has it in the top level folder of your webapp.


**2.** **IMPORTANT:** Make sure the system clock on your webserver is accurately set to network time! On unix systems, this is usually done with the ntp package.  It doesn't matter which timezone you are using.  For Debian/Ubuntu:

```
    sudo apt-get install ntp
```

**3.** 'QueueFairService` uses the `cookie-parser` module to process cookies.  If you don't already have it, get it with:

```
    npm install cookie-parser
```

**4.** Take a look at `express-example/server.js`

**5.** In your code you will need to copy and paste the `goQueueFair()` convenience function from `server.js`.  There is also example code for validating a cookie (Hybrid Security Model - see Technical Guide).

**6.** Take a look at `QueueFairConfig.js`, which shows the available configuration options for the adapter.

**7.** Set your Account Secret and Account System Name in the code where indicated.

**8.** The recommended way of using the Adapter is with async/await, as shown in the the `get('/')` method of `server.js`.  You can also use it without await, but if you do that only Simple mode is supported. That is shown in the `get('/about')` method of `server.js`.

**9.** **IMPORTANT** Note the `QueueFairConfig.debug` setting - this is set to true in the example code but you MUST set debug to false on production machines/live queues as otherwise your web logs will rapidly become full.  You can safely set it to a single IP address to just output debug information for a single visitor, even on a production machine.

**10.** To run the adapter, call `goQueueFair()` in your routes or headers as shown in server.js

That's it your done!

In your `server.js` functions you should always ensure that `goQueueFair()` is the *first* thing that happens within your functions.  This will ensure that the Adapter is the first thing that runs when a vistor accesses any page, which is necessary both to protect your server from load from lots of visitors and also so that the adapter can set the necessary cookies.  You can then use the Activation Rules in the Portal to set which pages on your site may trigger a queue.

In the case where the Adapter sends the request elsewhere (for example to show the user a queue page), `goQueueFair()` will return false and the rest of the page should not be run.

If your web server is sitting behind a proxy, CDN or load balancer, you may need to edit the property sets in `goQueueFair()` to use values from forwarded headers instead.  If you need help with this, contact Queue-Fair support.

### To test the Server-Side Adapter

Use a queue that is not in use on other pages, or create a new queue for testing.

#### Testing SafeGuard
Set up an Activtion Rule to match the page you wish to test.  Hit Make Live.  Go to the Settings page for the queue.  Put it in SafeGuard mode.  Hit Make Live again.

In a new Private Browsing window, visit the page on your site.  

 - Verify that you can see debug output from the Adapter in your error-log.
 - Verify that a cookie has been created named `QueueFair-Pass-queuename`, where queuename is the System Name of your queue
 - If the Adapter is in Safe mode, also verify that a cookie has been created named QueueFair-Store-accountname, where accountname is the System Name of your account (on the Your Account page on the portal).
 - If the Adapter is in Simple mode, the QueueFair-Store cookie is not created.
 - Hit Refresh.  Verify that the cookie(s) have not changed their values.

#### Testing Queue
Go back to the Portal and put the queue in Demo mode on the Queue Settings page.  Hit Make Live.  Delete any QueueFair-Pass cookies from your browser.  In a new tab, visit https://accountname.queue-fair.net , and delete any QueueFair-Pass or QueueFair-Data cookies that appear there.  Refresh the page that you have visited on your site.

 - Verify that you are now sent to queue.
 - When you come back to the page from the queue, verify that a new QueueFair-Pass-queuename cookie has been created.
 - If the Adapter is in Safe mode, also verify that the QueueFair-Store cookie has not changed its value.
 - Hit Refresh.  Verify that you are not queued again.  Verify that the cookies have not changed their values.

**IMPORTANT:**  Once you are sure the Server-Side Adapter is working as expected, remove the Client-Side JavaScript Adapter tag from your pages, and don't forget to disable debug level logging by setting `QueueFairConfig.DEBUG` to False (its default value), and also set `QueueFairConfig.settingsCacheLifetimeMiutes` to at least 5 (also its default value).

**IMPORTANT:**  Responses that contain a `Location:` header or a `Set-Cookie` header from the Adapter must not be cached!  You can check which cache-control headers are present using your browser's Inspector Network Tab.  The Adapter will add a Cache-Control header to disable caching if it sets a cookie or sends a redirect - but you must not override these with your own code or framework.

### For maximum security

The Server-Side Adapter contains multiple checks to prevent visitors bypassing the queue, either by tampering with set cookie values or query strings, or by sharing this information with each other.  When a tamper is detected, the visitor is treated as a new visitor, and will be sent to the back of the queue if people are queuing.

 - The Server-Side Adapter checks that Passed Cookies and Passed Strings presented by web browsers have been signed by our Queue-Server.  It uses the Secret visible on each queue's Settings page to do this.
 - If you change the queue Secret, this will invalidate everyone's cookies and also cause anyone in the queue to lose their place, so modify with care!
 - The Server-Side Adapter also checks that Passed Strings coming from our Queue Server to your web server were produced within the last 30 seconds, which is why your clock must be accurately set.
 - The Server-Side Adapter also checks that passed cookies were produced within the time limit set by Passed Lifetime on the queue Settings page, to prevent visitors trying to cheat by tampering with cookie expiration times or sharing cookie values.  So, the Passed Lifetime should be set to long enough for your visitors to complete their transaction, plus an allowance for those visitors that are slow, but no longer.
 - The signature also includes the visitor's USER_AGENT, to further prevent visitors from sharing cookie values.

## AND FINALLY

All client-modifiable settings are in the `QueueFairConfig` class.  You should never find you need to modify `QueueFairAdapter.js` - but if something comes up, please contact support@queue-fair.com right away so we can discuss your requirements.

Remember we are here to help you! The integration process shouldn't take you more than an hour - so if you are scratching your head, ask us.  Many answers are contained in the Technical Guide too.  We're always happy to help!

