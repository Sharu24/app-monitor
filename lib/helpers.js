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

helpers.parseJsonToObject = (str) => {
    if (str) {
        const obj = JSON.parse(str);
        return obj;
    } else {
        return {};
    }
}

module.exports = helpers;
