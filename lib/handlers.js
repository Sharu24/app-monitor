const _data = require('./data');
const helpers = require('./helpers');

//Router Handler
const handlers = {};


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




handlers.homePage = (clientData, callback) => {
    callback(200, { "Status": "Home Page Route" });
}

handlers.notFound = (clientData, callback) => {
    callback(404, { "Status": "Not Found" });
}

module.exports = handlers;