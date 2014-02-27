/**
 * Just a wrapper around 'nconf'.
 */

var nconf = require('nconf'),
    logger = require('winston'),
    fs = require('fs');

module.exports = nconf;

// Load configuration settings

// Set default values

//Setup nconf to use (in-order):
//1. Command-line arguments
//2. Environment variables

nconf.argv()
  .env();

//3. A file located at ..   (so we can call ./ndode server --config confile.json   )
var configFile =  null; //TODO: set proper config file path
if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}

if (configFile) {
  if (fs.existsSync(configFile)) {
    configFile = fs.realpathSync(configFile);
    logger.info('using custom config file: '+configFile);
  } else {
    logger.warn('Cannot find custom config file: '+configFile);
  }
  nconf.file({ file: configFile});
}

nconf.defaults({
  //TODO: group Pryv API settings in "pryv" property
  pryvdomain : 'rec.la', // will be set to pryv.io in production
  pryvStaging: true,
  database: {
    host: 'localhost',
    name: 'twitter-gateway'
  },
  http: {
    ip: '0.0.0.0',
    certsPathAndKey: './cert/rec.la',
    port: 3000 // !! take care of updating twitter:callbackBaseURL accordingly
  },
  logs: {
    console: {
      active: false, // console log is active by default in Winston
      level: 'debug',
      colorize: true
    },
    file: {
      active: false,
      level: 'error',
      path: 'twitter-gateway.log',
      maxFileBytes: 4096,
      maxNbFiles: 20
    }
  },
  twitter: {
    callbackBaseURL: 'https://openhardware.ch:3000',
    consumerKey: 's4iHUFq1lumSStZa0JEw',
    consumerSecret: 'OFkYVjdqZPNnSNEx8jlhJQ9PqDfw8GBnBupn8tKhI'
  }
});
