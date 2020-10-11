const usersHandler = require("../routes/users");
const tokensHandler = require("../routes/tokens");
const checksHandler = require("../routes/checks");
const helpers = require("../lib/helpers");

const handlers = {};

/**--------------------------------------------------------
 * User Route - Invokes Appropriate Route method
 ----------------------------------------------------------*/
handlers.users = clientData => {
  const { method } = clientData;
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(method)) {
    return usersHandler[method](clientData);
  } else {
    return Promise.reject({
      statusCode: helpers.statusCodes.INVALID_METHOD,
      message: "Invalid HTTP Method."
    });
  }
};

/**--------------------------------------------------------
 * Tokens Route - Invokes Appropriate Route method
 ----------------------------------------------------------*/
handlers.tokens = clientData => {
  const { method } = clientData;
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(method)) {
    return tokensHandler[method](clientData);
  } else {
    return Promise.reject({
      statusCode: helpers.statusCodes.INVALID_METHOD,
      message: "Invalid HTTP Method."
    });
  }
};

/**--------------------------------------------------------
 * Checks Route - Invokes Appropriate Route method
 ----------------------------------------------------------*/
handlers.checks = clientData => {
  const { method } = clientData;
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(method)) {
    return checksHandler[method](clientData);
  } else {
    return Promise.reject({
      statusCode: helpers.statusCodes.INVALID_METHOD,
      message: "Invalid HTTP Method."
    });
  }
};

/**--------------------------------------------------------
 * Home Route
 ----------------------------------------------------------*/
handlers.homePage = () => {
  return Promise.resolve({
    statusCode: helpers.statusCodes.SUCCESS,
    message: "You've reached the home page."
  });
};

/**--------------------------------------------------------
 * Route not found
 ----------------------------------------------------------*/
handlers.notFound = clientData => {
  return Promise.reject({
    statusCode: helpers.statusCodes.NOT_FOUND,
    message: "Route not found"
  });
};

const router = {
  users: handlers.users,
  "": handlers.homePage,
  tokens: handlers.tokens,
  checks: handlers.checks
};

/**--------------------------------------------------------
 * Identify Route - based on URL path, decide the route
 ----------------------------------------------------------*/
handlers.identifyRoute = async clientData => {
  try {
    const trimmedPath = clientData.trimmedPath;
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;
    const handlerResponse = await chosenHandler(clientData);
    return Promise.resolve(handlerResponse);
  } catch (err) {
    return Promise.reject({
      statusCode: err.statusCode,
      message: "ERROR: " + err.message
    });
  }
};

module.exports = handlers;
