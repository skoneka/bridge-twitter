var app = require('./app'),
    config = require('./utils/config'),
    fs = require('fs'),
    logger = require('winston');

// setup sensible logging defaults
logger['default'].transports.console.timestamp = true;

var server;
if (! config.get('http:noSSL')) { // if SSL...
  var certsPathAndKey = config.get('http:certsPathAndKey');
  var serverOptions = {
    key: fs.readFileSync(certsPathAndKey + '-key.pem').toString(),
    cert: fs.readFileSync(certsPathAndKey + '-cert.crt').toString(),
    ca: fs.readFileSync(certsPathAndKey + '-ca.pem').toString()
  };
  server = require('https').createServer(serverOptions, app);
} else {
  server = require('http').createServer(app);
}

server.listen(config.get('http:port'), config.get('http:ip'), function () {
  var address = server.address();
  var protocol = server.key ? 'https' : 'http';
  server.url = protocol + '://' + address.address + ':' + address.port;
  logger.info('Twitter bridge server ' + server.url + ' in ' + app.settings.env + ' mode');
});

module.exports = server;

// TODO: review logging (incl. messages)
