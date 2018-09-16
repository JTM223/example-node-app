const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis);
const config = require("../config");
const client = redis.createClient(config.database.redis.port, config.database.redis.host);

module.exports = client;
