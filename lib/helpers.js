const crypto = require('crypto');
const configs = require('../config');
const https = require('https');
const queryString = require('querystring');
const util = require('util');

const helpers = {};
const httpsRequest = util.promisify(https.request);

//Method to hash the password string
helpers.hash = (str) => {
    if (typeof (str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', configs.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}

helpers.parseJsonToObject = (str) => {
    if(!str) {
        return {};
    }
    return JSON.parse(str);
}

helpers.createRandomString = (strLength) => {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    if(!strLength)
        return false;
    
    const possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let str = '';
    for(let i=0; i<strLength; i++) {
        let randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        str += randomChar;
    }
    return str;
}

helpers.statusCodes = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INVALID_METHOD: 405,
    REQUEST_TIMEOUT: 408,
    SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503
};

helpers.sendTwilioSMS = async (phone, message) => {
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    message = typeof message === 'string' && message.trim().length > 0 ? message.trim() : false;

    if(!phone && message) {
        return Promise.reject("Given Parameter is missing or Invalid");
    }

    let payload = {
        'From' : configs.twilio.fromPhone,
        'To' : "+91" + phone,
        'Body' : message
    };

    //Stringify the Payload
    let stringPayload = queryString.stringify(payload);

    let requestDetails = {
        'protocol' : 'https:',
        'hostname' : 'api.twilio.com',
        'method' : 'POST',
        'path' : '/2010-04-01/Accounts/' + configs.twilio.accountSid + '/Messages.json',
        'auth' : configs.twilio.accountSid + ':' + configs.twilio.authToken,
        'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(stringPayload)
        }
    };

    let req = await httpsRequest(requestDetails);
    let req = https.request(requestDetails, (res) => {
        let status = res.statusCode;
        if(status === 200 || status === 201)
            return Promise.resolve(false);
        else
            return Promise.resolve('Status Code Returned is ', status);
    })

    req.on('error', (err) => {
        return Promise.resolve(err);
    });

    //Add the payload to the request details object
    req.write(stringPayload);
    req.end();
}

const init = async () => {
    let sms = await helpers.sendTwilioSMS("9960125854", "Hello From the other side.");
    console.log(sms);
}

init();
module.exports = helpers;