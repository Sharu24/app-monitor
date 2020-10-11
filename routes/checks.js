const config = require("../lib/config");
const helpers = require("../lib/helpers");
const data = require("../store/data");
const tokens = require("./tokens");

const checks = {};

/**--------------------------------------------------------
 * Service Checker Route (To fetch a Service Checker)
 * 
 * @method       GET
 * @params       id(check)
 * @required     id(check)
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/
checks.get = async clientData => {
  try {
    // Get id from query string
    let { id } = clientData.queryStringObject;
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    if (!id) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation Failed/Missing Fields"
      });
    }
    // Get the Checks data for the given id
    const checkData = await data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.NOT_FOUND,
        message: "Check id doesn't exist"
      });
    }
    // Get access token from request header
    const token =
      typeof clientData.headers.token === "string"
        ? clientData.headers.token
        : false;
    // Verify provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Unauthorised/Token expired"
      });
    }
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: checkData
    });
  } catch (err) {
    console.log(err);
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Server Error"
    });
  }
};

/**--------------------------------------------------------
 * Service Checker Route (To Create a New Service Checker)
 * 
 * @method       POST
 * @params       protocol, url, method, successCodes, 
 *               timeoutSeconds
 * @required     all
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/
checks.post = async clientData => {
  try {
    let {
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds
    } = clientData.payload;
    // Get all required fields from request payload
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
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation failed/Missing fields"
      });
    }
    // Get the token from request headers
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    // Verify given token is valid for the specific user
    // Look up for user by reading the token
    const tokenData = await data.read("tokens", token);
    if (!tokenData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Unauthorised/Token expired"
      });
    }
    const userPhone = tokenData.phone;

    // ** To be removed later ** START
    const istokenValid = await tokens.verify(token, userPhone);
    //Verify the given token is valid for the given user
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "UnAuthorised. No Access Token is in Headers"
      });
    }
    // ** To be removed later ** END

    const userData = await data.read("users", userPhone);
    if (!userData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Unauthorised. No User available with this token"
      });
    }
    const userChecks =
      typeof userData.checks === "object" && userData.checks instanceof Array
        ? userData.checks
        : [];
    // Check maxchecks count
    if (userChecks.length >= config.maxChecks) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: `User already exhausted maximum number of Checks. The limit is ${config.maxChecks}`
      });
    }
    // Create a random id for the Check
    const checkId = helpers.createRandomString(20);
    const checkObject = {
      id: checkId,
      userPhone,
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds
    };
    await data.create("checks", checkId, checkObject);
    // Add Check data to Users schema
    userData.checks = userChecks;
    userData.checks.push(checkId);
    // Update User schema
    await data.update("users", userPhone, userData);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: checkObject
    });
  } catch (err) {
    err;
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Server Error"
    });
  }
};

/**--------------------------------------------------------
 * Service Checker Route (To Update a Service Checker)
 * 
 * @method       PUT
 * @params       id, protocol, url, method, successCodes, 
 *               timeoutSeconds
 * @required     id
 * @optional     protocol, url, method, successCodes, 
 *               timeoutSeconds
 * @privateRoute yes
 ----------------------------------------------------------*/
checks.put = async clientData => {
  try {
    let {
      id,
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds
    } = clientData.payload;
    // Get id from request payload
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    // Get optional fields from request payload
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
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation failed/Missing fields"
      });
    }
    const checkData = await data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.NOT_FOUND,
        message: "Check id doesn't exist"
      });
    }
    // Get access token from request headers
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    // Verify provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Unauthorised/Token expired"
      });
    }
    // Update the Check data with new values
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
    // Save updated Check data to file
    await data.update("checks", id, checkData);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: checkData
    });
  } catch (err) {
    console.log(err);
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Server Error"
    });
  }
};

/**--------------------------------------------------------
 * Service Checker Route (To delete a Service Checker)
 * 
 * @method       DELETE
 * @params       id(check)
 * @required     id(check)
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/
checks.delete = async clientData => {
  try {
    // Get id from request query string
    let { id } = clientData.queryStringObject;
    id = typeof id === "string" && id.trim().length === 20 ? id.trim() : false;
    if (!id) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation failed/Missing fields"
      });
    }
    const checkData = await data.read("checks", id);
    if (!checkData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.NOT_FOUND,
        message: "Check id doesn't exist"
      });
    }
    // Get the access token from request headers
    let { token } = clientData.headers;
    token = typeof token === "string" ? token : false;
    // Verify provided token is valid for the given user
    const istokenValid = await tokens.verify(token, checkData.userPhone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Unauthorised/Token expired."
      });
    }
    // Delete the check Data
    // First Delete the Check file for the given id
    await data.delete("checks", id);
    // Delete Check id in User schema
    // Look up for the user and get userData
    const userData = await data.read("users", checkData.userPhone);
    if (!userData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Could not find the specified User"
      });
    }
    const userChecks =
      typeof userData.checks === "object" && userData.checks instanceof Array
        ? userData.checks
        : [];
    // Remove Check from the User data
    const checkPosition = userChecks.indexOf(id);
    if (checkPosition > -1) {
      userChecks.splice(checkPosition, 1);
      // Save updated data
      await data.update("users", checkData.userPhone, userData);
      return Promise.resolve({
        statusCode: helpers.statusCodes.SUCCESS,
        message: "Check id is deleted and User schema is updated"
      });
    }
  } catch (err) {
    console.log(err);
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Server Error"
    });
  }
};

module.exports = checks;
