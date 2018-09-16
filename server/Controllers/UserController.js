const bcrypt = require('bcrypt');
const ValidationError = require("../Errors/ValidationError");
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
* Serves the ability to create users and perform authentication
* In the future the database function will be abstracted to models
* @class UserController
*/
module.exports = class UserController {

  constructor (db) {
    this.db = db;
  }

  /**
  * Performs basic validation and creates the user
  * @param req {username, password} the request body
  */
  createUser (req) {
    return new Promise((res, rej) => {
      let {username, password} = req;

      this.validate(username, password).then(() => {
        //hash the password and store the user
        bcrypt.hash(password, 10).then( hash => {
          this.db.set('user_' + username, JSON.stringify({username: username, password: hash}));
          res({username: username});
        });
      }).catch(err => {
        //catch any validation error and reject
        rej(err);
      });
    });
  }

  /**
  * Create the jwt token for the user
  * @param req {username, password} The request body
  */
  login (req) {
    return this.db.getAsync('user_' + req.username)
      .then(user => {
        user = JSON.parse(user);

        if (!user) {
          throw new ValidationError("Not found");
        }

        //check the password
        return bcrypt.compare(req.password, user.password).then((matchPassword) => {

          if (!matchPassword) {
            throw new ValidationError("Unauthorized");
          }
          //create the token
          return {username: user.username, token: jwt.sign({username: user.username}, config.auth.secret)};
        });
      });
  }

  /**
  * This function returns user details. At the moment we just return the username
  * but in the future we can add extra logic to return other details
  * @param req the request
  */
  getUserDetails (req) {
    return {username: req.username};
  }

  /**
  * Validat the user details for creation
  * @param username string
  * @param password string
  */
  validate (username, password) {
    //check the username and password
    if (username === '' || !password === '') {
      return Promise.reject(new ValidationError("Invalid user details"));
    }

    //check the user does not already exist
    return this.db.getAsync('user_'+ username).then( user => {
      if (user)
        throw new ValidationError("User already exists");
    });
  }
}
