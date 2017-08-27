# Email Tracking Beacon

## Introduction

> A quick POC of an email tracking beacon written in Node.js. Given an email address, the server returns a URL to be embedded into an email. Upon requesting the resource at the URL, an entry is made into the data store to create a profile of the client. A mock email is then sent detailing information about the opener of the email.

Usage
------------------------------------------------------------------------------


1. To get an image URL for a particular email address:
Send a POST request to ``/recipients`` with a JSON body in this  format ``{"email": "john@smith.com"}``

e.g.``curl -X POST http://localhost:3000/recipients -H 'content-type: application/json' -d '{"email": "john@smith.com"}'``

OR

Use Postman https://www.getpostman.com/

2. To receive mock emails: 
open the URL created above in a web browser while the server is running to see it logged on to the console.
![Email Example](/images/email-log.png?raw=true)


## Installation


1. Run ``npm install`` for dependencies
3. Run ``npm start``
4. Start making requests to ``localhost:3000/recipients``

### Running tests
1. ``cd`` into the root directory
2. Mocha should be installed with the dev dependencies
3. Run ``npm test``