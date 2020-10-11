const crypto = require("crypto");
const https = require("https");
const queryString = require("querystring");
const configs = require("../lib/config");

const helpers = {};

/**--------------------------------------------------------
 * Hash the given string using crypto (sha256)
 * 
 * @params       A String
 * @returns      Hashed String
 ----------------------------------------------------------*/
helpers.hash = str => {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", configs.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

/**--------------------------------------------------------
 * Parse a Given String and return the Object
 * 
 * @params       A String
 * @returns      An Object
 ----------------------------------------------------------*/
helpers.parseJsonToObject = str => {
  return !str ? {} : JSON.parse(str);
};

/**--------------------------------------------------------
 * Create a Random String of given Length
 * 
 * @params       Length of the random string
 * @returns      A Random String
 ----------------------------------------------------------*/
helpers.createRandomString = strLength => {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (!strLength) return false;

  const possibleCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < strLength; i++) {
    let randomChar = possibleCharacters.charAt(
      Math.floor(Math.random() * possibleCharacters.length)
    );
    str += randomChar;
  }
  return str;
};

/**--------------------------------------------------------
 * Status Code Description and its id
 ----------------------------------------------------------*/
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

/**--------------------------------------------------------
 * Method that triggers a HTTPS request
 * 
 * @params       Service Request Details, 
 *               Notification Message
 * @returns      Promise : Notification Status
 ----------------------------------------------------------*/
helpers.httpsRequest = (requestDetails, stringPayload) => {
  return new Promise((resolve, reject) => {
    let req = https.request(requestDetails, res => {
      //Lets grab the status of the sent request
      let status = res.statusCode;
      if (status == 200 || status == 201) {
        resolve(false);
      } else {
        reject("Status code returned is " + status);
      }
    });
    req.on("error", error => {
      reject(error);
    });
    //Add the payload to the request details object
    req.write(stringPayload);
    //end the request event
    req.end();
  });
};

/**--------------------------------------------------------
 * Method that Prepares Request Object to Notify though SMS
 * 
 * @params       phone, message
 * @returns      Promise : Notification Status
 ----------------------------------------------------------*/
// Method to trigger an SMS
helpers.sendTwilioSMS = async (phone, message) => {
  try {
    //------ Data Validation ------
    phone =
      typeof phone === "string" && phone.trim().length === 10
        ? phone.trim()
        : false;
    message =
      typeof message === "string" && message.trim().length < 1600
        ? message.trim()
        : false;
    if (!(phone && message)) {
      return Promise.reject({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Given params missing or invalid"
      });
    }
    //------ Construct the payload for https ------
    // Configure SMS payload
    let payload = {
      From: configs.twilio.fromPhone,
      To: "+91" + phone,
      Body: message
    };
    //Stringify the payload
    let stringPayload = queryString.stringify(payload);
    let requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + configs.twilio.accountSid + "/Messages.json",
      auth: configs.twilio.accountSid + ":" + configs.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };
    //------ Hit the Check Url with payload ------
    return await helpers.httpsRequest(requestDetails, stringPayload);
  } catch (error) {
    console.error(error);
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Unable to deal with Twilio"
    });
  }
};

/*
helpers
  .sendTwilioSMS(
    "9960125854",
    "Hello World at " + new Date().toString()
  )
  .then(response => console.log("Responding ", response))
  .catch(error => console.log(error));
*/

module.exports = helpers;
