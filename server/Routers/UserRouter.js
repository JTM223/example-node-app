const router = require('express').Router();
const UserController = require('../Controllers/UserController');
const bodyParser = require('body-parser');
const authMiddleware = require('../Middleware/AuthMiddleware');
const ValidationError = require('../Errors/ValidationError');
const db = require('../Database/RedisDatabase');

const controller = new UserController(db);

router.use(bodyParser.json())

/**
* Create the user
*/
router.post('/create', (req, res) => {
    controller.createUser(req.body).then(user => {
      return res.send(user);
    }).catch(error => {
      if (error instanceof ValidationError) {
        res.status(400);
      }

      return res.send({errors: error.message});
    });
});

/**
* Login
*/
router.post('/login', (req, res) => {
    return controller.login(req.body).then(user => {
      return res.send(user);
    }).catch(error => {
      if (error instanceof ValidationError) {
        res.status(401);
      }
      return res.send({errors: error.message});
    });
});

/**
* Get user details
*/
router.get('/', authMiddleware(db), (req, res) => {
  return res.send(controller.getUserDetails(req.user));
});

module.exports = router;
