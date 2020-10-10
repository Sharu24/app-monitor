const usersHandler = require('../routerHandlers/users');
const tokensHandler = require('../routerHandlers/tokens');
const checksHandler = require('../routerHandlers/checks');
const helpers = require('./helpers');

const handlers = {};

handlers.users = (clientData) => {
    const { method } = clientData;
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.includes(method)) {
        return usersHandler[method](clientData);
    }
    else {
        return Promise.reject({'statusCode' : helpers.statusCodes.INVALID_METHOD, 'message' : 'Invalid HTTP Method.'});
    }
}

handlers.tokens = (clientData) => {
    const { method } = clientData;
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.includes(method)) {
        return tokensHandler[method](clientData);
    }
    else {
        return Promise.reject({'statusCode' : helpers.statusCodes.INVALID_METHOD, 'message' : 'Invalid HTTP Method.'});
    }
}

handlers.checks = (clientData) => {
    const { method } = clientData;
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.includes(method)) {
        return checksHandler[method](clientData);
    }
    else {
        return Promise.reject({'statusCode' : helpers.statusCodes.INVALID_METHOD, 'message' : 'Invalid HTTP Method.'});
    }
}

handlers.homePage = () => {
    return Promise.resolve({'statusCode' : helpers.statusCodes.SUCCESS, 'message' : "You've reached the home page."});
}

handlers.notFound = (clientData) => {
    return Promise.reject({'statusCode' : helpers.statusCodes.NOT_FOUND, 'message' : 'Route not found'});
}

const router = {
    'users' : handlers.users,
    '' : handlers.homePage,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
}


handlers.identifyRoute = async (clientData) => {
    try {
        const trimmedPath = clientData.trimmedPath;
        const chosenHandler = typeof router[trimmedPath] !== 'undefined'
            ? router[trimmedPath] : handlers.notFound;
        const handlerResponse = await chosenHandler(clientData);
        return Promise.resolve(handlerResponse);
    }
    catch(err) {
        return Promise.reject({'statusCode' : err.statusCode, 'message' : 'ERROR: ' + err.message});
    }
}


module.exports = handlers;