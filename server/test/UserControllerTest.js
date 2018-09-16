const assert = require('assert');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserController = require('../Controllers/UserController')

const sinon = require('sinon');

describe('UserController', () => {
  //fake our db functions
  const fake = {
    getAsync: sinon.stub(),
    set: sinon.fake()
  };

  const controller = new UserController(fake);

  //fake bcrypt
  const bcryptHashStub = sinon.stub(bcrypt, 'hash')
  const bcryptCompareStub = sinon.stub(bcrypt, 'compare')

  /** createUserTests */
  describe('#createUser', () => {
    //set up input
    const validInput = {username:'user', password: 'password'};
    const invalidInput = {username:'', password: ''};

    //fake validate functions
    const validateStub = sinon.stub(controller, 'validate');

    it ("Creates on valid input", () => {
      //validate the input and create a fake password
      validateStub.withArgs(validInput.username, validInput.password).resolves();
      bcryptHashStub.resolves('hashedpassword');

      return controller.createUser(validInput).then(result => {
        //check we validate input and calls set on the db
        assert(fake.set.calledWith('user_user', JSON.stringify({username:'user', password: 'hashedpassword'})));
        assert.deepEqual(result, {username: 'user'});
        validateStub.restore();
        bcryptHashStub.restore();
      });

    });

    it ("Rejects on invalid input", (done) => {
      //fail validation
      validateStub.withArgs(invalidInput.username, invalidInput.password).rejects();

      //check that an error is thrown
      controller.createUser(invalidInput).then(() => {
        validateStub.restore();
        done(new Error("Did not throw an error"));
      }).catch(err => {
        assert(err);
        validateStub.restore();
        done();
      });
    });


  });

  /** Login Tests */
  describe("#login", () => {
    // setup inputs
    const validInput = {username:'user', password: 'password'};
    const invalidInput = {username:'user', password: 'invalidpassword'};
    const userNotFoundInput = {username: '', password: ''};

    it ('logs in successfully with valid input', () => {
      // set up a fake user to be returned. We also set a fake token and make sure
      // our password compare is true
      fake.getAsync.withArgs('user_user').resolves(JSON.stringify({username:'user', password:'password'}));
      const jwtStub = sinon.stub(jwt, 'sign').returns('token');
      bcryptCompareStub.withArgs('password', 'password').resolves(true);

      //check the token is returned
      return controller.login(validInput).then(result => {
        //check the token is returned correctly
        assert.deepEqual(result, {username:'user', token: 'token'});
      }).then(() => {
        jwtStub.restore();
        bcryptCompareStub.restore();
      });
    });

    it ('fails to login with invalid password', (done) => {
      // Fail the password compare
      bcryptCompareStub.withArgs('invalidpassword', 'password').resolves(false);
      fake.getAsync.withArgs('user_user').resolves(JSON.stringify({username:'user', password:'password'}));

      //checkl that the correct error is thrown
      controller.login(invalidInput).then(() => {
        done(new Error("No error thrown"));
      }).catch(err => {
        assert.equal(err.message, "Unauthorized")
        bcryptCompareStub.restore();
        done();
      })
    });

    it ('fails to login with missing user', (done) => {
      // make sure the db returns and empty record
      fake.getAsync.withArgs('user_').resolves(null);

      // check the correct error is thrown
      controller.login(userNotFoundInput).then(() => {
        done(new Error("Error no thrown"));
      }).catch (err => {
        assert.equal(err.message, "Not found");
        done();
      });
    });
  });

  /** User Details tests */
  describe("#getUserDetails", () => {
    it("returns user details", () => {
      assert.deepEqual(controller.getUserDetails({username: 'user'}), {username: 'user'});
    });
  });

  /** Validation tests */
  describe('#validate', () => {
    const validInput = {username:'user', password: 'password'};
    const invalidInput = {username:'user2', password: 'invalidpassword'};
    const emptyInput = {username: '', password: ''};

    it ("does not throw on valid input", (done) => {
      // make sure the user does not exists
      fake.getAsync.withArgs('user_' + validInput.username).resolves(null);

      // check that the validate function doesn't throw an error on valid input
      controller.validate(validInput.username, validInput.password).then(() => {
        done();
      }).catch(err => {
        done(err);
      })
    })

    it ("throws on empty input", (done) => {
      //check we get invalid details on empty input
      controller.validate(emptyInput.username, emptyInput.password).then(() => {
        done(new Error("Did not throw an error"))
      }).catch(err => {
        assert.equal(err.message, "Invalid user details");
        done();
      });
    });

    it ("throws on duplicate user", (done) => {
      // Have the db return an existing user
      fake.getAsync.withArgs('user_' + invalidInput.username).resolves(JSON.stringify(invalidInput));

      // Check the correct error is thrown when details already exist
      controller.validate(invalidInput.username, invalidInput.password).then(() => {
        done(new Error("Did not throw an error"));
      }).catch (err => {
        assert.equal(err.message, "User already exists");
        done();
      });
    });
  });
});
