var app = require('./app'),
    config = require('./utils/config'),
    fs = require('fs'),
    winston = require('winston');


var certsPathAndKey = config.get('http:certsPathAndKey');
var serverOptions = {
  key: fs.readFileSync(certsPathAndKey+'-key.pem').toString(),
  cert: fs.readFileSync(certsPathAndKey+'-cert.crt').toString(),
  ca: fs.readFileSync(certsPathAndKey+'-ca.pem').toString()
};


server = require('https').createServer(serverOptions, app),
server.listen(config.get('http:port'), config.get('http:ip'), function() {
  var address = server.address();
  var protocol = server.key ? 'https' : 'http';
  server.url = protocol + '://' + address.address + ':' + address.port;
  winston.info('Twitter server ' + server.url + ' in ' + app.settings.env + ' mode');
});

module.exports = server;