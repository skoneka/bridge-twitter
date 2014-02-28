/**
 * The Express app definition. For usage from `server`.
 */

var express = require('express'),
    twitter = require('./lib/twitter'),
    usersStorage = require('./storage/users-storage'),
    app = module.exports = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
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

usersStorage.listUsers(function (users) {
  console.log(users);
  twitter.streamTweetsFromExistingUsers(users);
});

require('./routes/index')(app);
require('./routes/api')(app);