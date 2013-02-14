/**
 * Just a wrapper around 'nconf'.
 */

var nconf = require('nconf');

module.exports = nconf;

// Load configuration settings

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
nconf.argv()
     .env()
     .file({ file: 'config.json' }); //TODO: set proper config file path

// Set default values

nconf.defaults({
  database: {
    host: 'localhost',
    port: 27017,
    name: 'twitter-gateway'
  },
  http: {
    ip: '127.0.0.1',
    port: 3443
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
  }
});
