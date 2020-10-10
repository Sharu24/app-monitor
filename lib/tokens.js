const helpers = require("./helpers");
const _data = require("./data");

const tokens = {};

/**
 * Authentication MiddleWare
 * Purpose: Verify if a given token ID is currently valid
 *          for a given user
 */

tokens.verify = async (id, phone) => {
  try {
    // Verify the token first
    const tokenData = await _data.read("tokens", id);
    if (!tokenData) return Promise.resolve(false);

    console.log(tokenData.phone, phone, tokenData.expires, Date.now());
    //Proceed further to match with a user
    if (tokenData.phone !== phone || tokenData.expires <= Date.now()) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  } catch (error) {
    console.error(error);
    return Promise.resolve(false);
  }
};

/**
 * Tokens Route
 * Method : POST
 * Required Data: phone, password
 * Optional Data: none
 */
tokens.post = async clientData => {
  try {
    //Validate request query param for phone number
    const phone =
      typeof clientData.payload.phone === "string" &&
      clientData.payload.phone.trim().length === 10
        ? clientData.payload.phone.trim()
        : false;

    const password =
      typeof clientData.payload.password === "string" &&
      clientData.payload.password.length >= 0
        ? clientData.payload.password
        : false;

    if (!(phone && password)) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Invalid/Missing Fields"
      });
    }

    // Check if a User with the mobile exists
    const userData = await _data.read("users", phone);
    if (!userData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Invalid Phone Number"
      });
    }

    // hash the sent password and compare it with the
    // existing hash password in the userData
    const hashedPassword = hash(password);
    if (userData.hashedPassword !== hashedPassword) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Invalid Password"
      });
    }

    // Create the token for the valid user
    const tokenId = helpers.createRandomString(20);
    const expires = Date.now() + 1000 * 60 * 5;

    const tokenObject = {
      phone: phone,
      id: tokenId,
      expires: expires
    };

    // Store the token in data/token folder
    await _data.create("tokens", tokenId, tokenObject);

    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: tokenObject
    });
  } catch (error) {
    console.error(error);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Error in creating a new Token"
    });
  }
};

/**----------------------------------------------------------------------------
 * Tokens Route
 * Method : GET
 * Required Data: tokenId
 * Optional Data: none
 */
tokens.get = async clientData => {
  try {
    // CHeck if the tokenId is valid or Not
    const id =
      typeof clientData.queryStringObject.id === "string" &&
      clientData.queryStringObject.id.trim().length === 20
        ? clientData.queryStringObject.id.trim()
        : false;

    if (!id) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation: Invalid/Missing ID"
      });
    }

    // Look up for the token
    const tokenData = await _data.read("tokens", id);

    if (!tokenData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Invalid Token"
      });
    }

    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: tokenData
    });
  } catch (error) {
    console.error(error);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: 'Could not Read Token"'
    });
  }
};

/**----------------------------------------------------------------------------
 * Tokens Route
 * Method : PUT
 * Required Data: tokenId, extend
 * Optional Data: none
 */
tokens.put = async clientData => {
  try {
    //Validate input fields
    const id =
      typeof clientData.queryStringObject.id === "string" &&
      clientData.queryStringObject.id.trim().length === 20
        ? clientData.queryStringObject.id.trim()
        : false;
    const extend =
      typeof clientData.payload.extend === "boolean" &&
      clientData.payload.extend === true
        ? true
        : false;
    if (!(id && extend)) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation: Invalid/Missing Fields"
      });
    }
    // Fetch and validate tokens data from storage
    const tokenData = await _data.read("tokens", id);
    if (!tokenData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Validation: Invalid Token"
      });
    }

    // Check if the token has already expired
    if (tokenData.expires <= Date.now()) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Token Expired Or cannot be Extended"
      });
    }

    // Extend the token expiration time for an hour and update the storage
    tokenData.expires = Date.now() + 1000 * 60 * 60;
    await _data.update("tokens", id, tokenData);
    if (!tokenData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Token does not exists"
      });
    }

    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: "User Session extended"
    });
  } catch (error) {
    console.error(error);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Invalid Token ID, Unable to Update Tokens"
    });
  }
};

/**----------------------------------------------------------------------------
 * Tokens Route
 * Method : DELETE
 * Required Data: tokenId
 * Optional Data: none
 */
tokens.delete = async clientData => {
  try {
    // CHeck if the tokenId is valid or Not
    const id =
      typeof clientData.queryStringObject.id === "string" &&
      clientData.queryStringObject.id.trim().length === 20
        ? clientData.queryStringObject.id.trim()
        : false;
    if (!id) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Validation: Missing Id"
      });
    }

    //Delete tokens from Storage
    await _data.delete("tokens", id);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: "Token Deleted Successfully"
    });
  } catch (error) {
    console.error(error);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Invalid Token ID, Unable to Delete Tokens"
    });
  }
};

module.exports = tokens;
