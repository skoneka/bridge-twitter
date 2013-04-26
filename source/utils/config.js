/**
 * Just a wrapper around 'nconf'.
 */

var nconf = require('nconf'),
  logger = require('winston')
  fs = require('fs');

module.exports = nconf;

// Load configuration settings

// Set default values
var configFile =  './source/utils/config.json'; //TODO: set proper config file path

//Setup nconf to use (in-order):
//1. Command-line arguments
//2. Environment variables

nconf.argv()
  .env();

//3. A file located at ..   (so we can call ./ndode server --config confile.json   )
if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}

if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  logger.info('using custom config file: '+configFile);
} else {
  logger.error('Cannot find custom config file: '+configFile);
}

nconf.file({ file: configFile});

nconf.defaults({
  pryvdomain : 'rec.la', // will be set to pryv.io in production
  database: {
    host: 'localhost',
    name: 'twitter-gateway'
  },
  http: {
    ip: '0.0.0.0',
    certsPathAndKey: './cert/rec.la',
    port: 80 // !! take care of updating twitter:callbackBaseURL accordingly
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
    callbackBaseURL: 'https://localhost:80',
    consumerKey: '',
    consumerSecret: ''
  }
});
