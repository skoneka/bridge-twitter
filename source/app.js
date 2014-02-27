/**
 * The Express app definition. For usage from `server`.
 */

var express = require('express'),
    twitter = require('./lib/twitter'),
    Pryv = require('pryv'),
    usersStorage = require('./storage/users-storage');


var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret:'whatever'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});


usersStorage.listUsers(function(users){
  console.log(users);
  twitter.streamTweetsFromExistingUsers(users);
});


var connection = new Pryv.Connection({username:'perkikiki',auth:'VPoFEsuJRM', staging: true});
var filter = new Pryv.Filter({limit : 20});

connection.accessInfo(function(error, infos) {

      if (error) console.log(error);
      console.log('MY FIRT APP signed in:');
      console.dir(infos);


      console.log("my connection:");
      console.log("##############");
      console.dir(connection);
      // create an event to remeber that you logged in

      // connection.events.get(filter, function(error, events) {
      //   if (error) {
      //     console.error(error);
      //   } else {
      //     console.dir(events);
      //   }
      // });

});


require('./routes/index')(app);
require('./routes/api')(app);