
var usersStorage = require('../storage/users-storage'),
    twitter = require('./twitter');


exports.authProcessDetails = function(req, res) {
  var response = {
    url: 'https://api.twitter.com/oauth/authorize',
    info: 'pryv\'s token must be provided'
  };
  res.send(response);
};


exports.createUser = function(req, res) {
  //var username = req.params.username;
  var user = req.body.user;
  usersStorage.createUser(user, function(result){
    res.send(result);
  });
};


exports.readUser = function(req, res) {
  var username = req.params.username;
  usersStorage.readUser({'pryv.credentials.username':username}, function(result){
    if (!result) return res.send({error:'no such user'});
    res.send(result);
  });
};


exports.updateUser = function(req, res) {
  // if (!req.body.user) return res.send({error:'user data missing'});
  var username = req.params.username;
  usersStorage.updateUser({'pryv.credentials.username':username}, req.body, function(result){
    res.send(result);
  });
};


exports.transferUserTimeline = function(req, res) {
  var username = req.params.username;
  twitter.transferUserTimeline(username, function(err, data) {
    res.send(data);
  });
};


exports.readSchema = function(req, res) {
  usersStorage.readSchema(function(result){
    res.set('Content-Type', 'application/json');
    res.send(result);
  });
};


exports.listUsers = function(req, res) {
  usersStorage.listUsers(function(result){
    res.send(result);
  });
};