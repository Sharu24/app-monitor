const crypto = require('crypto');
const config = require('../config');

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



module.exports = helpers;
