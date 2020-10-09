const config = require("../config");
const _data = require("./data");
const tokens = require("./tokens");
const helpers = require("./helpers");

const checks = {};

/*
Service Checker  Route (To Create a New Service Checker)
GET   Method
Required Data : id
Optional Data : none
Private Route
*/
checks.get = async (clientData) => {
  try {
    //Validate the id from clientData
    let { id } = clientData.queryStringObject;
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    //Check the checks folder if the id really exists
    if (!id) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Validation Failed/ Missing Fields",
      });
    }
    //Read check data
    const checkData = await _data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: 404,
        Message: "Check ID is not valid. Not Found.",
      });
    }
    //Check for access token
    const token =
      typeof clientData.headers.token === "string"
        ? clientData.headers.token
        : false;
    //Verify the provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: 401,
        Message: "UnAuthorised / Token Expired.",
      });
    }
    return Promise.resolve({ statusCode: 200, Message: checkData });
  } catch (err) {
    console.error(err);
    return Promise.reject({ statusCode: 500, Message: "Server Error" });
  }
};

/*
Service Checker Route (To Create a New Service Checker)
POST   Method
Required Data : protocol,url,method,successCodes,timeoutSeconds
Optional Data : none
Private Route
*/

checks.post = async (clientData) => {
  try {
    let {
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds,
    } = clientData.payload;

    protocol =
      typeof protocol === "string" && ["http", "https"].indexOf(protocol) > -1
        ? protocol
        : false;
    url = typeof url === "string" && url.trim().length > 0 ? url.trim() : false;
    method =
      typeof method === "string" &&
      ["post", "get", "put", "delete"].indexOf(method) > -1
        ? method
        : false;
    successCodes =
      typeof successCodes === "object" &&
      successCodes instanceof Array &&
      successCodes.length > 0
        ? successCodes
        : false;
    timeoutSeconds =
      typeof timeoutSeconds === "number" &&
      timeoutSeconds % 1 === 0 &&
      timeoutSeconds >= 1 &&
      timeoutSeconds <= 5
        ? timeoutSeconds
        : false;

    if (!(protocol && url && method && successCodes && timeoutSeconds)) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Validation Failed/ Missing Fields",
      });
    }
    //Lets get the token from headers
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    //Verify the given token is valid for the given user
    //Look up the user by reading the token
    const tokenData = await _data.read("tokens", token);
    if (!tokenData) {
      return Promise.resolve({
        statusCode: 401,
        Message: "UnAuthorised / Token Expired.",
      });
    }
    const userPhone = tokenData.phone;
    const userData = await _data.read("users", userPhone);
    if (!userData) {
      return Promise.resolve({
        statusCode: 401,
        Message: "UnAuthorised. No User Available with this token",
      });
    }
    const userChecks =
      typeof userData.checks === "object" && userData.checks instanceof Array
        ? userData.checks
        : [];
    //Verify maxchecks count
    if (userChecks.length > config.maxChecks) {
      return Promise.resolve({
        statusCode: 401,
        Message: `User already exhausted max checks. Limit is ${config.maxChecks}`,
      });
    }
    //Create a random id for the check
    const checkId = helpers.createRandomString(20);
    //Lets create checkObject
    const checkObject = {
      id: checkId,
      userPhone,
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds,
    };
    await _data.create("checks", checkId, checkObject);
    //We need to add check to users schema
    userData.checks = userChecks;
    userData.checks.push(checkId);
    // Update user schema
    await _data.update("users", userPhone, userData);
    return Promise.resolve({ statusCode: 200, Message: checkObject });
  } catch (err) {
    err;
    return Promise.reject({ statusCode: 500, Message: "Server Error" });
  }
};

/*
Service Checker  Route (To Update a Existing Service Checker)
PUT   Method
Required Data : id
Optional Data : rest of the fields (one must be required)
Private Route
*/
checks.put = async (clientData) => {
  try {
    //Validate the id from clientData
    let {
      id,
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds,
    } = clientData.payload;
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    //Optional Fields
    protocol =
      typeof protocol === "string" && ["http", "https"].indexOf(protocol) > -1
        ? protocol
        : false;
    url = typeof url === "string" && url.trim().length > 0 ? url.trim() : false;
    method =
      typeof method === "string" &&
      ["post", "get", "put", "delete"].indexOf(method) > -1
        ? method
        : false;
    successCodes =
      typeof successCodes === "object" &&
      successCodes instanceof Array &&
      successCodes.length > 0
        ? successCodes
        : false;
    timeoutSeconds =
      typeof timeoutSeconds === "number" &&
      timeoutSeconds % 1 === 0 &&
      timeoutSeconds >= 1 &&
      timeoutSeconds <= 5
        ? timeoutSeconds
        : false;

    if (!id && !(protocol || url || method || successCodes || timeoutSeconds)) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Validation Failed/ Missing Fields",
      });
    }
    const checkData = await _data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Check ID doesnt exist",
      });
    }
    //Check for access token
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    //Verify the provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: 401,
        Message: "UnAuthorised / Token Expired.",
      });
    }
    //Update the check
    if (protocol) {
      checkData.protocol = protocol;
    }
    if (url) {
      checkData.url = url;
    }
    if (method) {
      checkData.method = method;
    }
    if (successCodes) {
      checkData.successCodes = successCodes;
    }
    if (timeoutSeconds) {
      checkData.timeoutSeconds = timeoutSeconds;
    }
    //Save the Updated Data to file disk
    await _data.update("checks", id, checkData);
    return Promise.resolve({ statusCode: 200, Message: checkData });
  } catch (err) {
    console.log(err);
    return Promise.reject({ statusCode: 500, Message: "Server Error" });
  }
};

/*
Service Checker  Route (To Delete a Existing Service Check)
DELETE   Method
Required Data : id
Optional Data : none
Private Route
*/
checks.delete = async (clientData) => {
  try {
    //Validate the id from clientData
    let { id } = clientData.queryStringObject;
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    if (!id) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Validation Failed/ Missing Fields",
      });
    }
    const checkData = await _data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Check ID doesnt exist",
      });
    }
    //Check for access token
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    //Verify the provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: 401,
        Message: "UnAuthorised / Token Expired.",
      });
    }
    //Delete the check Data
    //First Delete the check id file
    await _data.delete("checks", id);
    //Now we need delete checks id in user schema
    //Look up the user and get userData
    const userData = await _data.read("users", checkData.userPhone);
    if (!userData) {
      return Promise.resolve({
        statusCode: 400,
        Message: "Could not find the specified user",
      });
    }
    const userChecks =
      typeof userData.checks === "object" && userData.checks instanceof Array
        ? userData.checks
        : [];
    //Remove the check from the array
    const checkPosition = userChecks.indexOf(id);
    if (checkPosition > -1) {
      userChecks.splice(checkPosition, 1);
      //Re save the updated data
      await _data.update("users", checkData.userPhone, userData);
      return Promise.resolve({
        statusCode: 200,
        Message: "Deleted Check Id and Updated The User Schema",
      });
    }
  } catch (err) {
    console.log(err);
    return Promise.reject({ statusCode: 500, Message: "Server Error" });
  }
};

module.exports = checks;
