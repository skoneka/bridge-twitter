var app = require('./app'),
    config = require('./utils/config'),
    server = require('http').createServer(app);

module.exports = server;

server.listen(config.get('http:port'), config.get('http:ip'), function() {
  var address = server.address();
  var protocol = server.key ? 'https' : 'http';
  server.url = protocol + '://' + address.address + ':' + address.port;
  console.log('Activity server ' + server.url + ' in ' + app.settings.env + ' mode');
});
