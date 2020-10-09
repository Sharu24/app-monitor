const _data = require("./data");
const helpers = require("./helpers");

const tokens = {};

/*
Tokens  Route - User Login Route
POST Method
Required Data : phone,password
Optional Data : none
*/
tokens.post = (clientData, callback) => {
  //Data Validation
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

  if (phone && password) {
    //Look up the User with the given phone number
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        //Hash the Sent password and compare it to the exisitng hash password in the userData
        //Hash the client sent password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          //Then we can go and try to create a new access token
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 5;

          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires,
          };
          //Store the Token in Tokens Folder/Collection
          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create token" });
            }
          });
        } else {
          callback(401, { Error: "Invalid Password. UnAuthorised." });
        }
      } else {
        callback(401, { Error: "Invalid Phone Number. UnAuthorised." });
      }
    });
  } else {
    callback(400, { Error: "Missing fields/Validation Failed" });
  }
};

/*
Tokens  Route 
GET Method
Required Data : tokenId
Optional Data : none
*/
tokens.get = (clientData, callback) => {
  //Check the tokenId is valid or not
  const id =
    typeof clientData.queryStringObject.id === "string" &&
    clientData.queryStringObject.id.trim().length === 20
      ? clientData.queryStringObject.id.trim()
      : false;
  if (id) {
    //Look up for the token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { Error: "Invalid Token. Unauthorised" });
      }
    });
  } else {
    callback(400, { Error: "Missing Id Field/Validation Failed" });
  }
};

/*
Tokens  Route (To extend the expiration of the session token)
PUT  Method
Required Data : tokenId
Optional Data : none
*/
tokens.put = (clientData, callback) => {
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

  if (id && extend) {
    //Continue in verifying token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        //Continue verifying token expiration
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          //Extend the token expiration time for an hour
          _data.update("tokens", id, tokenData, (err) => {
            if (!err) {
              callback(200, { Success: "User Session Extended" });
            } else {
              callback(500, { Error: "Server Error" });
              console.error(err);
            }
          });
        } else {
          callback(400, { Error: "Token already expired. Cant be extended." });
        }
      } else {
        callback(400, { Error: "Invalid Token" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields/Invalid" });
  }
};

/*
Tokens  Route (To Delete a Token)
DELETE  Method
Required Data : tokenId
Optional Data : none
*/
tokens.delete = (clientData, callback) => {
  const id =
    typeof clientData.queryStringObject.id === "string" &&
    clientData.queryStringObject.id.trim().length === 20
      ? clientData.queryStringObject.id.trim()
      : false;
  if (id) {
    //Look up the token is really exists
    _data.delete("tokens", id, (err) => {
      if (!err) {
        callback(200, { Success: "Token is Deleted" });
      } else {
        callback(404, { Error: "Invalid Tokens" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields/Invalid" });
  }
};

/*
Auth middleware
Purpose : Verify if a given token id is currently valid for a given user
*/
tokens.verify = (id, phone, callback) => {
  //Verify the Token First
  console.log("hello");
  _data.read("tokens", id, (err, tokenData) => {
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
  });
};

module.exports = tokens;
