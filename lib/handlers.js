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
@TODO - Later Make it as Private route
*/
handlers._users.get = (clientData, callback) => {
    //Check phone valid
    const phone = typeof (clientData.queryStringObject.phone) === 'string' &&
        clientData.queryStringObject.phone.trim().length === 10 ?
        clientData.queryStringObject.phone.trim() : false;
    if (phone) {
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
        callback(400, { "Error": "Missing Fields/Validation Error" });
    }
}

/*
User  Route
PUT Method
Required Data : phone
Optional Data : rest of the fileds except tosAgreement
@TODO - Later Make it as Private route
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
@TODO - Later Make it as Private route
@TODO - We should also delete service workers associated with the user
*/
handlers._users.delete = (clientData, callback) => {
    //Check phone valid
    const phone = typeof (clientData.queryStringObject.phone) === 'string' &&
        clientData.queryStringObject.phone.trim().length === 10 ?
        clientData.queryStringObject.phone.trim() : false;
    if (phone) {
        //Look up if the user record exists
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                //We can now delete account
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200, { "Success": "User Account Deleted Successfully" });
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