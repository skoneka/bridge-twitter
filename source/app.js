/**
 * The Express app definition. For usage from `server`.
 */

var express = require('express'),
    twitter = require('./lib/twitter'),
    storage = require('./storage/users'),
    app = module.exports = express();

app.configure(function () {
  // TODO: what's this for?
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  // TODO: don't use "dev" config when in production
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  // TODO: better secret
  app.use(express.session({secret: 'whatever'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
  app.use(express.errorHandler());
});

// TODO: move this to server (master of the init sequence)
storage.getUsers(function (users) {
  twitter.streamTweetsFromExistingUsers(users);
});

require('./routes/index')(app);
require('./routes/api')(app);
