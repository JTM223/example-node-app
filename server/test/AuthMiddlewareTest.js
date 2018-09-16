const jwt = require("jsonwebtoken");
const sinon = require("sinon");
const assert = require("assert");
const authMiddleware = require('../Middleware/AuthMiddleware');

/** Tests for Auth Middleware */
describe("AuthMiddleware", () => {
  const db = {
    getAsync: sinon.stub()
  };

  const resFake = {
    status: sinon.stub(),
    send: sinon.stub()
  };

  // set up fake request
  const token = "token";

  it ("Sets user on valid input", (done) => {
    const jwtStub = sinon.stub(jwt, "verify");
    let request = {headers: {"x-auth-token": token}};
    //fake the jwt data
    jwtStub.withArgs(token).returns({username: "user"});
    db.getAsync.withArgs("user_user").resolves(JSON.stringify({username: "user"}));

    let nextStub = sinon.fake(() => { return Promise.resolve(); });

    //check that the user is set
    authMiddleware(db)(request, resFake, nextStub).then(() => {
      assert(nextStub.calledOnce);
      assert(request.user);
      jwtStub.restore();
      done();
    });

  });

  it ("Return 401 on invalid token", (done) => {
    const jwtStub = sinon.stub(jwt, "verify");
    let request = {headers: {"x-auth-token": "invalid"}};

    jwtStub.withArgs("invalid").throws("error");
    resFake.status.returns(resFake);

    authMiddleware(db)(request, resFake, {});

    assert(resFake.status.calledWith(401));
    assert(resFake.send.calledWith({errors: "Invalid Token"}));

    jwtStub.restore();
    done();
  });

  it ("Returns 401 on invalid user", (done) => {
    let request = {headers: {"x-auth-token": "othertoken"}};
    //fake the jwt data
    const jwtStub = sinon.stub(jwt, 'verify');
    jwtStub.withArgs("othertoken").returns({username: "user2"});
    db.getAsync.withArgs("user_user2").resolves(null);

    //check that the user is set
    authMiddleware(db)(request, resFake, {}).then(() => {
      assert(resFake.status.calledWith(401));
      assert(resFake.send.calledWith({errors: "Unauthorized access"}));
      jwtStub.restore();
      done();
    });
  });

});
