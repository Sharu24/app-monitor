const { time } = require('console');
const { type } = require('os');
const configs = require('../config');
const _data = require('./data');
const helpers = require('./helpers');

//Router Handler
const handlers = {};

///////////////////////////////////////////////////////////////////////////////////////

//User Router
handlers.users = (clientData, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(clientData.method) > -1) {
        handlers._users[clientData.method](clientData, callback)
    } else {
        callback(405, { "Error": "Invalid HTTP Method" });
    }
}

handlers._users = {};
/*
User Registration Route
POST Method
Schema : firstName, lastName, phone(Unique), password, tosAgreement, email //Required Data
Optional Data : none
*/
handlers._users.post = (clientData, callback) => {
    //Data Validation
    const firstName = typeof (clientData.payload.firstName) === 'string' &&
        clientData.payload.firstName.trim().length > 0 ?
        clientData.payload.firstName.trim() : false;
    const lastName = typeof (clientData.payload.lastName) === 'string' &&
        clientData.payload.lastName.trim().length > 0 ?
        clientData.payload.lastName.trim() : false;
    const phone = typeof (clientData.payload.phone) === 'string' &&
        clientData.payload.phone.trim().length === 10 ?
        clientData.payload.phone.trim() : false;
    const password = typeof (clientData.payload.password) === 'string' &&
        clientData.payload.password.length >= 6 ?
        clientData.payload.password : false;
    const email = typeof (clientData.payload.email) === 'string' &&
        clientData.payload.email.trim().length > 0 ?
        clientData.payload.email.trim() : false;
    const tosAgreement = typeof (clientData.payload.tosAgreement) === 'boolean' &&
        clientData.payload.tosAgreement === true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement && email) {
        //Make sure that user already not registered with us
        _data.read('users', phone, (err, data) => {
            if (err) {
                //Safe to create a new account
                //Hash the password 
                const hashedPassword = helpers.hash(password);
                const userObject = {
                    'firstName': firstName,
                    'lastName': lastName,
                    'phone': phone,
                    'hashedPassword': hashedPassword,
                    'email': email,
                    'tosAgreement': true
                }
                //Lets save the user in our file disk
                _data.create('users', phone, userObject, (err) => {
                    if (!err) {
                        callback(200, { "Success": "User Account Created Successfully" });
                    } else {
                        console.error(err);//Debugging
                        callback(500, { "Error": "Could not create the user account" });
                    }
                })

            } else {
                callback(400, { "Error": "An User with this phone number already registered" });
            }
        })

    } else {
        callback(400, { "Error": "Missing Fields/Validation Error" });
    }
}

/*
User  Route
GET Method
Required Data : phone
Optional Data : none
Private route
*/
handlers._users.get = (clientData, callback) => {
    //Check phone valid
    const phone = typeof (clientData.queryStringObject.phone) === 'string' &&
        clientData.queryStringObject.phone.trim().length === 10 ?
        clientData.queryStringObject.phone.trim() : false;
    if (phone) {
        //Lets get the token from headers
        const token = typeof (clientData.headers.token) === 'string'
            ? clientData.headers.token : false;
        //Verify the given token is valid for the given user
        handlers._tokens.verify(token, phone, (istokenValid) => {
            if (istokenValid) {
                //Look Up the User really exists in file disk
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        //Remove the hashed password field and tos field
                        delete data.hashedPassword;
                        delete data.tosAgreement;
                        callback(200, data);
                    } else {
                        callback(400, { "Error": "An User with this phone number doesnt exist." });
                    }
                })
            } else {
                callback(403, { "Error": "UnAuthorised. No Access Token is in Headers" });
            }
        })
    } else {
        callback(400, { "Error": "Missing Fields/Validation Error" });
    }
}

/*
User  Route
PUT Method
Required Data : phone
Optional Data : rest of the fileds except tosAgreement
*/
handlers._users.put = (clientData, callback) => {
    //Check phone valid
    const phone = typeof (clientData.payload.phone) === 'string' &&
        clientData.payload.phone.trim().length === 10 ?
        clientData.payload.phone.trim() : false;
    //Check for optional fields
    const firstName = typeof (clientData.payload.firstName) === 'string' &&
        clientData.payload.firstName.trim().length > 0 ?
        clientData.payload.firstName.trim() : false;
    const lastName = typeof (clientData.payload.lastName) === 'string' &&
        clientData.payload.lastName.trim().length > 0 ?
        clientData.payload.lastName.trim() : false;
    const password = typeof (clientData.payload.password) === 'string' &&
        clientData.payload.password.length >= 6 ?
        clientData.payload.password : false;
    const email = typeof (clientData.payload.email) === 'string' &&
        clientData.payload.email.trim().length > 0 ?
        clientData.payload.email.trim() : false;
    if (phone) {
        if (firstName || lastName || password || email) {
            //Lets get the token from headers
            const token = typeof (clientData.headers.token) === 'string'
                ? clientData.headers.token : false;
            //Verify the given token is valid for the given user
            handlers._tokens.verify(token, phone, (istokenValid) => {
                if (istokenValid) {
                    _data.read('users', phone, (err, userData) => {
                        if (!err && userData) {
                            //Continue in Updating the User Profile
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (email) {
                                userData.email = email;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //Lets save the updated userData into file disk
                            _data.update('users', phone, userData, (err) => {
                                if (!err) {
                                    callback(200, { "Success": "User Pofile Updated Successfully" });
                                } else {
                                    console.error(err);//Debugging
                                    callback(500, { "Error": "Could not update the user profile" });
                                }
                            })
                        } else {
                            callback(400, { "Error": "An User with this phone number doesnt exist." });
                        }
                    })
                } else {
                    callback(403, { "Error": "UnAuthorised. No Access Token is in Headers" });
                }
            });
        } else {
            callback(400, { "Error": "Missing Fields/Validation Error" });
        }
    } else {
        callback(400, { "Error": "Missing Phone Field" });
    }
}



/*
User  Route
DELETE Method
Required Data : phone
Optional Data : none
Private route
*/
handlers._users.delete = (clientData, callback) => {
    //Check phone valid
    const phone = typeof (clientData.queryStringObject.phone) === 'string' &&
        clientData.queryStringObject.phone.trim().length === 10 ?
        clientData.queryStringObject.phone.trim() : false;
    if (phone) {
        //Lets get the token from headers
        const token = typeof (clientData.headers.token) === 'string'
            ? clientData.headers.token : false;
        //Verify the given token is valid for the given user
        handlers._tokens.verify(token, phone, (istokenValid) => {
            if (istokenValid) {
                //Look up if the user record exists
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        //We can now delete account
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                //Delete the checks that are assoicated with this user
                                const userChecks = typeof (data.checks) === 'object'
                                    && data.checks instanceof Array ? data.checks : [];
                                const checksToDelete = userChecks.length;
                                let deletionErrors = false;
                                let checksDeleted = 0;
                                if (checksToDelete > 0) {
                                    userChecks.forEach(check => {
                                        //Delete the check file
                                        _data.delete('checks', check, (err) => {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted === checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200, { "Success": "User Account Deleted Successfully" });
                                                } else {
                                                    callback(500, { "Error": "Server Error" });
                                                }
                                            }
                                        })
                                    });
                                } else {
                                    callback(200, { "Success": "User Account Deleted Successfully" });
                                }

                            } else {
                                console.error(err);//Debugging
                                callback(500, { "Error": "Could not update the user profile" });
                            }
                        })
                    } else {
                        callback(400, { "Error": "An User with this phone number doesnt exist." });
                    }
                })
            } else {
                callback(403, { "Error": "UnAuthorised. No Access Token is in Headers" });
            }
        });
    } else {
        callback(400, { "Error": "Missing Phone Field" });
    }

}
///////////////////////////////////////////////////////////////////////////////////////
//Tokens Router
handlers.tokens = (clientData, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(clientData.method) > -1) {
        handlers._tokens[clientData.method](clientData, callback);
    } else {
        callback(405, { "Error": "Invalid HTTP Method" });
    }
}

handlers._tokens = {};

/*
Tokens  Route - User Login Route
POST Method
Required Data : phone,password
Optional Data : none
*/
handlers._tokens.post = (clientData, callback) => {
    //Data Validation
    const phone = typeof (clientData.payload.phone) === 'string' &&
        clientData.payload.phone.trim().length === 10 ?
        clientData.payload.phone.trim() : false;
    const password = typeof (clientData.payload.password) === 'string' &&
        clientData.payload.password.length >= 0 ?
        clientData.payload.password : false;

    if (phone && password) {
        //Look up the User with the given phone number
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                //Hash the Sent password and compare it to the exisitng hash password in the userData
                //Hash the client sent password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    //Then we can go and try to create a new access token
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 5;

                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    }
                    //Store the Token in Tokens Folder/Collection
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { "Error": "Could not create token" });
                        }
                    })
                } else {
                    callback(401, { "Error": "Invalid Password. UnAuthorised." });
                }
            } else {
                callback(401, { "Error": "Invalid Phone Number. UnAuthorised." });
            }
        })

    } else {
        callback(400, { "Error": "Missing fields/Validation Failed" });
    }
}


/*
Tokens  Route 
GET Method
Required Data : tokenId
Optional Data : none
*/
handlers._tokens.get = (clientData, callback) => {
    //Check the tokenId is valid or not
    const id = typeof (clientData.queryStringObject.id) === 'string' &&
        clientData.queryStringObject.id.trim().length === 20 ?
        clientData.queryStringObject.id.trim() : false;
    if (id) {
        //Look up for the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404, { "Error": "Invalid Token. Unauthorised" });
            }
        })
    } else {
        callback(400, { "Error": "Missing Id Field/Validation Failed" });
    }
}

/*
Tokens  Route (To extend the expiration of the session token)
PUT  Method
Required Data : tokenId
Optional Data : none
*/
handlers._tokens.put = (clientData, callback) => {
    const id = typeof (clientData.queryStringObject.id) === 'string' &&
        clientData.queryStringObject.id.trim().length === 20 ?
        clientData.queryStringObject.id.trim() : false;
    const extend = typeof (clientData.payload.extend) === 'boolean'
        && clientData.payload.extend === true ? true : false;

    if (id && extend) {
        //Continue in verifying token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                //Continue verifying token expiration
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    //Extend the token expiration time for an hour
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200, { "Success": "User Session Extended" });
                        } else {
                            callback(500, { "Error": "Server Error" });
                            console.error(err);
                        }
                    })
                } else {
                    callback(400, { "Error": "Token already expired. Cant be extended." });
                }
            } else {
                callback(400, { "Error": "Invalid Token" })
            }
        })
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }

}

/*
Tokens  Route (To Delete a Token)
DELETE  Method
Required Data : tokenId
Optional Data : none
*/
handlers._tokens.delete = (clientData, callback) => {
    const id = typeof (clientData.queryStringObject.id) === 'string' &&
        clientData.queryStringObject.id.trim().length === 20 ?
        clientData.queryStringObject.id.trim() : false;
    if (id) {
        //Look up the token is really exists
        _data.delete('tokens', id, (err) => {
            if (!err) {
                callback(200, { "Success": "Token is Deleted" });
            } else {
                callback(404, { "Error": "Invalid Tokens" });
            }
        })
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }
}

/*
Auth middleware
Purpose : Verify if a given token id is currently valid for a given user
*/
handlers._tokens.verify = (id, phone, callback) => {
    //Verify the Token First
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            //Proceed Further to match with a User
            if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

///////////////////////////////////////////////////////////////////////////////////////

//Service Checkers Router

handlers.checks = (clientData, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(clientData.method) > -1) {
        handlers._checks[clientData.method](clientData, callback);
    } else {
        callback(405, { "Error": "Invalid HTTP Method" });
    }
}

handlers._checks = {};

/*
Service Checker  Route (To Create a New Service Checker)
POST   Method
Required Data : protocol,url,method,successCodes,timeoutSeconds
Optional Data : none
Private Route
*/
handlers._checks.post = (clientData, callback) => {
    const protocol = typeof (clientData.payload.protocol) === 'string'
        && ['http', 'https'].indexOf(clientData.payload.protocol) > -1
        ? clientData.payload.protocol : false;
    const url = typeof (clientData.payload.url) === 'string' &&
        clientData.payload.url.trim().length > 0
        ? clientData.payload.url.trim() : false;
    const method = typeof (clientData.payload.method) === 'string'
        && ['post', 'get', 'put', 'delete'].indexOf(clientData.payload.method) > -1
        ? clientData.payload.method : false;
    const successCodes = typeof (clientData.payload.successCodes) === 'object'
        && clientData.payload.successCodes instanceof Array
        && clientData.payload.successCodes.length > 0
        ? clientData.payload.successCodes : false;
    const timeoutSeconds = typeof (clientData.payload.timeoutSeconds) === 'number'
        && clientData.payload.timeoutSeconds % 1 === 0
        && clientData.payload.timeoutSeconds >= 1
        && clientData.payload.timeoutSeconds <= 5
        ? clientData.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        //Lets get the token from headers
        const token = typeof (clientData.headers.token) === 'string'
            ? clientData.headers.token : false;
        //Verify the given token is valid for the given user
        //Look up the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof (userData.checks) === 'object'
                            && userData.checks instanceof Array ? userData.checks : [];
                        //Verify maxchecks count
                        if (userChecks.length < configs.maxChecks) {
                            //Create a random id for the check
                            const checkId = helpers.createRandomString(20);
                            //Lets create checkObject
                            const checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            }
                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    //We need to add check to users schema
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    //Lets update the user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { 'Error': 'Server Error' });
                                        }
                                    })
                                } else {
                                    callback(500, { 'Error': 'Server Error in Creating Check' });
                                }
                            })
                        } else {
                            callback(400, { "Error": `The User already exhausted max checks. Limit is ${configs.maxChecks}` })
                        }

                    } else {
                        callback(403, { "Error": "UnAuthorised. No User Available with this token" });
                    }
                })

            } else {
                callback(403, { "Error": "UnAuthorised. No Access Token in Headers" });
            }
        })
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }
}

/*
Service Checker  Route (To Create a New Service Checker)
GET   Method
Required Data : id
Optional Data : none
Private Route
*/
handlers._checks.get = (clientData, callback) => {
    //Validate the id from clientData
    const id = typeof (clientData.queryStringObject.id) === 'string' &&
        clientData.queryStringObject.id.trim().length === 20 ?
        clientData.queryStringObject.id.trim() : false;
    if (id) {
        //Check the checks folder if the id really exists
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //Check for access token
                const token = typeof (clientData.headers.token) === 'string' ? clientData.headers.token : false;
                //Verify the provided token is valid for the given user
                handlers._tokens.verify(token, checkData.userPhone, (istokenValid) => {
                    if (istokenValid) {
                        callback(200, checkData);
                    } else {
                        callback(403, { "Error": "UnAuthorised / Token Expired." });
                    }
                })
            } else {
                callback(404, { "Error": "Check ID is not valid. Not FOund." });
            }
        })
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }
}

/*
Service Checker  Route (To Update a Existing Service Checker)
PUT   Method
Required Data : id
Optional Data : rest of the fields (one must be required)
Private Route
*/
handlers._checks.put = (clientData, callback) => {
    //Validate the id from clientData
    const id = typeof (clientData.payload.id) === 'string' &&
        clientData.payload.id.trim().length === 20 ?
        clientData.payload.id.trim() : false;
    //Optional Fields
    const protocol = typeof (clientData.payload.protocol) === 'string'
        && ['http', 'https'].indexOf(clientData.payload.protocol) > -1
        ? clientData.payload.protocol : false;
    const url = typeof (clientData.payload.url) === 'string' &&
        clientData.payload.url.trim().length > 0
        ? clientData.payload.url.trim() : false;
    const method = typeof (clientData.payload.method) === 'string'
        && ['post', 'get', 'put', 'delete'].indexOf(clientData.payload.method) > -1
        ? clientData.payload.method : false;
    const successCodes = typeof (clientData.payload.successCodes) === 'object'
        && clientData.payload.successCodes instanceof Array
        && clientData.payload.successCodes.length > 0
        ? clientData.payload.successCodes : false;
    const timeoutSeconds = typeof (clientData.payload.timeoutSeconds) === 'number'
        && clientData.payload.timeoutSeconds % 1 === 0
        && clientData.payload.timeoutSeconds >= 1
        && clientData.payload.timeoutSeconds <= 5
        ? clientData.payload.timeoutSeconds : false;
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    //Check for access token
                    const token = typeof (clientData.headers.token) === 'string' ? clientData.headers.token : false;
                    //Verify the provided token is valid for the given user
                    handlers._tokens.verify(token, checkData.userPhone, (istokenValid) => {
                        if (istokenValid) {
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
                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200, checkData);
                                } else {
                                    callback(500, { "error": "server error" });
                                }
                            })
                        } else {
                            callback(403, { "Error": "UnAuthorised / Token Expired." });
                        }
                    });
                } else {
                    callback(400, { "Error": "Check ID doesnt exist" });
                }
            })
        } else {
            callback(400, { "Error": "Missing Required Fields/Invalid" });
        }
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }
}
/*
Service Checker  Route (To Delete a Existing Service Check)
DELETE   Method
Required Data : id
Optional Data : none
Private Route
*/
handlers._checks.delete = (clientData, callback) => {
    //Validate the id from clientData
    const id = typeof (clientData.queryStringObject.id) === 'string' &&
        clientData.queryStringObject.id.trim().length === 20 ?
        clientData.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //Check for access token
                const token = typeof (clientData.headers.token) === 'string' ? clientData.headers.token : false;
                //Verify the provided token is valid for the given user
                handlers._tokens.verify(token, checkData.userPhone, (istokenValid) => {
                    if (istokenValid) {
                        //Delete the check Data
                        //First Delete the check id file
                        _data.delete('checks', id, (err) => {
                            if (!err) {
                                //Now we need delete checks id in user schema
                                //Look up the user and get userData
                                _data.read('users', checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        const userChecks = typeof (userData.checks) === 'object'
                                            && userData.checks instanceof Array ? userData.checks : [];
                                        //Remove the check from the array
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            //Re save the updated data
                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    callback(200, { "Success": "Deleted Check Id and Updated The User Schema" })
                                                } else {
                                                    callback(500, { "error": "server error" });
                                                }
                                            })
                                        }
                                    } else {
                                        callback(400, { "Error": "Could not find the specified user" });
                                    }
                                })
                            } else {
                                callback(500, { "error": "server error" });
                            }
                        })
                    } else {
                        callback(403, { "Error": "UnAuthorised / Token Expired." });
                    }
                });
            } else {
                callback(400, { "Error": "Check ID doesnt exist" });
            }
        });
    } else {
        callback(400, { "Error": "Missing Required Fields/Invalid" });
    }
}





///////////////////////////////////////////////////////////////////////////////////////
/*
    User Home Page Route
*/
handlers.homePage = (clientData, callback) => {
    callback(200, { "Status": "Home Page Route" });
}
///////////////////////////////////////////////////////////////////////////////////////
/*
    User Not Found Route
*/
handlers.notFound = (clientData, callback) => {
    callback(404, { "Status": "Not Found" });
}
///////////////////////////////////////////////////////////////////////////////////////

module.exports = handlers;