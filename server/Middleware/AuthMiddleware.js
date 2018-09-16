const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = db => {
  return (req, res, next) => {
    let token = req.headers["x-auth-token"];

    try {
      let verified = jwt.verify(token, config.auth.secret);

      return db.getAsync("user_" + verified.username).then(user => {
        if (!user) {
          return res.status(401).send({errors: "Unauthorized access"});
        }

        user = JSON.parse(user);

        req.user = user;

        return next();
      });

    } catch (err) {

      return res.status(401).send({errors: "Invalid Token"});
    }
  };
}
