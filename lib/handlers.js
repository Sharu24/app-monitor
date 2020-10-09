const _checks = require("./checks");
const _tokens = require("./tokens");
const _users = require("./users");

//Router Handler
const handlers = {};

//User Route
handlers.users = (clientData, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(clientData.method) > -1) {
    _users[clientData.method](clientData, callback);
  } else {
    callback(405, { Error: "Invalid HTTP Method" });
  }
};

//Tokens Route
handlers.tokens = (clientData, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(clientData.method) > -1) {
    _tokens[clientData.method](clientData, callback);
  } else {
    callback(405, { Error: "Invalid HTTP Method" });
  }
};

//Service Checkers Route
handlers.checks = (clientData, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(clientData.method) > -1) {
    console.log(_checks);
    _checks[clientData.method](clientData, callback);
  } else {
    callback(405, { Error: "Invalid HTTP Method" });
  }
};

// User Home Page Route
handlers.homePage = (clientData, callback) => {
  callback(200, { Status: "Home Page Route" });
};

// User Not Found Route
handlers.notFound = (clientData, callback) => {
  callback(404, { Status: "Not Found" });
};

module.exports = handlers;
