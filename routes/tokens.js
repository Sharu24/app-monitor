const helpers = require("../lib/helpers");
const _data = require("../store/data");

const tokens = {};

/**--------------------------------------------------------
 * Authentication MiddleWare - Verify if a given token ID 
 * is currently valid for a given user
 * 
 * @params       id(token), phone
 * @required     id(token), phone
 * @optional     none
 ----------------------------------------------------------*/
tokens.verify = async (id, phone) => {
  try {
    // Verify the token first
    const tokenData = await _data.read("tokens", id);
    if (!tokenData) return Promise.resolve(false);

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

/**--------------------------------------------------------
 * User Login Route
 * 
 * @method       POST
 * @params       phone, password
 * @required     phone, password
 * @optional     none
 ----------------------------------------------------------*/
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
    const hashedPassword = helpers.hash(password);
    if (userData.hashedPassword !== hashedPassword) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "Invalid Password"
      });
    }

    // Create the token for the valid user
    const tokenId = helpers.createRandomString(20);
    const expires = Date.now() + 1000 * 60 * 60;

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

/**--------------------------------------------------------
 * To Check if the user has logged in
 * 
 * @method       GET
 * @params       token ID
 * @required     token ID
 * @optional     none
 ----------------------------------------------------------*/
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

/**--------------------------------------------------------
 * To Extend the User Session Expiry
 * 
 * @method       PUT
 * @params       tokenID, extendFlag
 * @required     tokenID, extendFlag
 * @optional     none
 ----------------------------------------------------------*/
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

    // Extend the token expiration time & update the storage
    tokenData.expires = Date.now() + 1000 * 60 * 5;
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

/**--------------------------------------------------------
 * To Delete a User
 * 
 * @method       DELETE
 * @params       token ID
 * @required     token ID
 * @optional     none
 ----------------------------------------------------------*/
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
