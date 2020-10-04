const crypto = require('crypto');
const config = require('../config');
const https = require('https');
const queryString = require('querystring');
const { stat } = require('fs');
const helpers = {};

//Method to hash the password string
helpers.hash = (str) => {
    if (typeof (str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}
//Converts json to object
helpers.parseJsonToObject = (str) => {
    if (str) {
        const obj = JSON.parse(str);
        return obj;
    } else {
        return {};
    }
}

//Create a Random String for access token
helpers.createRandomString = (strLength) => {
    strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for (let i = 1; i <= strLength; i++) {
            //Get a random character
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}

//Lets write a method that trigger an SMS
helpers.sendTwilioSMS = (phone, message, callback) => {
    //Data Validation
     phone = typeof (phone) === 'string'
        && phone.trim().length === 10
        ? phone.trim() : false;
     message = typeof (message) === 'string'
        && message.trim().length <= 1600
        ? message : false;
    if (phone && message) {
        //Configure the SMS Payload
        let payload = {
            "From": config.twilio.fromPhone,
            "To": "+91" + phone,
            "Body": message
        }
        //Stringify the payload
        let stringPayload = queryString.stringify(payload);

        let requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        //Trigger the Request Object to fire the Twilio SMS API

        let req = https.request(requestDetails, (res) => {
            //Lets grab the status of sent request
            let status = res.statusCode;
            if (status === 200 || status === 201) {
                callback(false)
            } else {
                callback("Status Code Returned is ", status);
            }
        });

        //Bind to the response error so it wont break the app
        req.on('error', (error) => {
            callback(error);
        });
        //Add the payload to the request details object
        req.write(stringPayload);
        //end the request event
        req.end();

    } else {
        callback("Given Params missing or Invalid");
    }
}

//Lets test SMS API
helpers.sendTwilioSMS('7899179779', "Code.in Website is up and running fine. Tested at" + new Date().toString(), (err) => {
    console.log("the Error is : " + err);
});


module.exports = helpers;
