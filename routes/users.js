const tokens = require("./tokens");
const helpers = require("../lib/helpers");
const _data = require("../store/data");

const users = {};

/**--------------------------------------------------------
 * User Registration
 * 
 * @method       POST
 * @params       firstName, lastName, phone(Unique), 
 *               password, tosAgreement, email
 * @required     all
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/

users.post = async clientData => {
  try {
    //Data Validation
    const firstName =
      typeof clientData.payload.firstName === "string" &&
      clientData.payload.firstName.trim().length > 0
        ? clientData.payload.firstName.trim()
        : false;
    const lastName =
      typeof clientData.payload.lastName === "string" &&
      clientData.payload.lastName.trim().length > 0
        ? clientData.payload.lastName.trim()
        : false;
    const phone =
      typeof clientData.payload.phone === "string" &&
      clientData.payload.phone.trim().length === 10
        ? clientData.payload.phone.trim()
        : false;
    const password =
      typeof clientData.payload.password === "string" &&
      clientData.payload.password.length >= 6
        ? clientData.payload.password
        : false;
    const email =
      typeof clientData.payload.email === "string" &&
      clientData.payload.email.trim().length > 0
        ? clientData.payload.email.trim()
        : false;
    const tosAgreement =
      typeof clientData.payload.tosAgreement === "boolean" &&
      clientData.payload.tosAgreement === true
        ? true
        : false;

    if (
      !(firstName && lastName && phone && password && tosAgreement && email)
    ) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Missing Fields/Validation Error"
      });
    }

    //Make sure that user already not registered with us
    const parsedData = await _data.read("users", phone);
    if (parsedData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "An User with this phone number already registered"
      });
    }

    //Safe to create a new account
    //Hash the password
    const hashedPassword = helpers.hash(password);
    const userObject = {
      firstName,
      lastName,
      phone,
      hashedPassword,
      email,
      tosAgreement: true
    };

    //Lets save the user in our file disk
    await _data.create("users", phone, userObject);

    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: "User was created Successfully"
    });
  } catch (err) {
    return Promise.reject({
      statusCode: helpers.statusCodes.SERVER_ERROR,
      message: "Servor Error"
    });
  }
};

/**--------------------------------------------------------
 * Fetch User Details 
 * 
 * @method       GET
 * @params       phone(Unique)
 * @required     phone
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/

users.get = async clientData => {
  try {
    const phone =
      typeof clientData.queryStringObject.phone === "string" &&
      clientData.queryStringObject.phone.trim().length === 10
        ? clientData.queryStringObject.phone.trim()
        : false;
    //Check phone valid
    if (!phone) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Missing Fields/Validation Error"
      });
    }
    //Lets get the token from headers
    const token =
      typeof clientData.headers.token === "string"
        ? clientData.headers.token
        : false;
    const istokenValid = await tokens.verify(token, phone);
    //Verify the given token is valid for the given user
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "UnAuthorised. No Access Token is in Headers"
      });
    }
    const data = await _data.read("users", phone);

    if (!data) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "User does not exist."
      });
    }
    delete data.hashedPassword;
    delete data.tosAgreement;
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: data
    });
  } catch (error) {
    return Promise.reject({
      statusCode: helpers.statusCodes.BAD_REQUEST,
      message: "Missing Fields/Validation"
    });
  }
};

/**--------------------------------------------------------
 * Update User Details 
 * 
 * @method       PUT
 * @params       phone(Unique)
 * @required     phone
 * @optional     firstName, lastName, password, email
 * @privateRoute yes
 ----------------------------------------------------------*/
users.put = async clientData => {
  try {
    //Check phone valid
    const phone =
      typeof clientData.payload.phone === "string" &&
      clientData.payload.phone.trim().length === 10
        ? clientData.payload.phone.trim()
        : false;
    //Check for optional fields
    const firstName =
      typeof clientData.payload.firstName === "string" &&
      clientData.payload.firstName.trim().length > 0
        ? clientData.payload.firstName.trim()
        : false;
    const lastName =
      typeof clientData.payload.lastName === "string" &&
      clientData.payload.lastName.trim().length > 0
        ? clientData.payload.lastName.trim()
        : false;
    const password =
      typeof clientData.payload.password === "string" &&
      clientData.payload.password.length >= 6
        ? clientData.payload.password
        : false;
    const email =
      typeof clientData.payload.email === "string" &&
      clientData.payload.email.trim().length > 0
        ? clientData.payload.email.trim()
        : false;

    if (!phone || !(firstName || lastName || password || email)) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Missing Fields/Validation Error"
      });
    }
    //Lets get the token from headers
    const token =
      typeof clientData.headers.token === "string"
        ? clientData.headers.token
        : false;
    //Verify the given token is valid for the given user
    const istokenValid = await tokens.verify(token, phone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "UnAuthorised. No Access Token is in Headers"
      });
    }
    const userData = await _data.read("users", phone);
    if (!userData) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "An User with this phone number doesnt exist."
      });
    }
    //Continue in Updating the User Profile
    // Update userData with new inputs
    userData.firstName = firstName ? firstName : userData.firstName;
    userData.lastName = lastName ? lastName : userData.lastName;
    userData.hashedPassword = password
      ? helpers.hash(password)
      : userData.hashedPassword;
    userData.email = email ? email : userData.email;

    //Lets save the updated userData into file disk

    await _data.update("users", phone, userData);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: "User Profile Updated"
    });
  } catch (error) {
    return Promise.reject({
      statusCode: helpers.statusCodes.BAD_REQUEST,
      message: "Missing Fields/Validation"
    });
  }
};

/**--------------------------------------------------------
 * Remove User
 * 
 * @method       DELETE
 * @params       phone (unique)
 * @required     phone
 * @optional     none
 * @privateRoute yes
 ----------------------------------------------------------*/
users.delete = async clientData => {
  try {
    //Check phone valid
    const phone =
      typeof clientData.queryStringObject.phone === "string" &&
      clientData.queryStringObject.phone.trim().length === 10
        ? clientData.queryStringObject.phone.trim()
        : false;

    if (!phone) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.BAD_REQUEST,
        message: "Missing Fields/Validation Error"
      });
    }
    //Lets get the token from headers
    const token =
      typeof clientData.headers.token === "string"
        ? clientData.headers.token
        : false;
    //Verify the given token is valid for the given user
    const istokenValid = await tokens.verify(token, phone);
    if (!istokenValid) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "UnAuthorised. No Access Token is in Headers"
      });
    }
    //Look up if the user record exists
    const data = await _data.read("users", phone);
    if (!data) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.UNAUTHORIZED,
        message: "An User with this phone number doesnt exist."
      });
    }
    //We can now delete account
    await _data.delete("users", phone);

    const userChecks =
      typeof data.checks === "object" && data.checks instanceof Array
        ? data.checks
        : [];
    const checksToDelete = userChecks.length;

    if (checksToDelete <= 0) {
      return Promise.resolve({
        statusCode: helpers.statusCodes.SUCCESS,
        message: "User Account Deleted Successfully"
      });
    }

    let checksPromise = [];
    if (userChecks.length) {
      userChecks.forEach(check => {
        checksPromise.push(_data.delete("checks", check));
      });
    }
    await Promise.all(checksPromise);
    return Promise.resolve({
      statusCode: helpers.statusCodes.SUCCESS,
      message: "User Account Deleted Successfully"
    });
  } catch (error) {
    return Promise.reject({
      statusCode: helpers.statusCodes.BAD_REQUEST,
      message: "Missing Fields/Validation"
    });
  }
};

module.exports = users;
