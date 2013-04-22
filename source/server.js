var app = require('./app'),
    config = require('./utils/config'),
    fs = require('fs'),
    winston = require('winston');

var serverOptions = {
	key: fs.readFileSync('./cert/rec.la-key.pem').toString(),
  cert: fs.readFileSync('./cert/rec.la-cert.crt').toString(),
  ca: fs.readFileSync('./cert/rec.la-ca.pem').toString()
};

server = require('https').createServer(serverOptions, app),
server.listen(config.get('http:port'), config.get('http:ip'), function() {
  var address = server.address();
  var protocol = server.key ? 'https' : 'http';
  server.url = protocol + '://' + address.address + ':' + address.port;
  winston.info('Activity server ' + server.url + ' in ' + app.settings.env + ' mode');
});

module.exports = server;