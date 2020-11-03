var log4js = require('log4js');
var logger = log4js.getLogger();

logger.level = process.env.DEBUG?'debug':'info';

module.exports = logger;
