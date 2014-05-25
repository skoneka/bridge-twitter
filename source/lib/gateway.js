// TODO: move directly into routes

var storage = require('../storage/users'),
    schema = require('../storage/schema'),
    twitter = require('./twitter');

exports.authProcessDetails = function (req, res) {
  var response = {
    url: 'https://api.twitter.com/oauth/authorize',
    info: 'pryv\'s token must be provided'
  };
  res.send(response);
};

exports.readSchema = function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send(schema.json(schema.Action.Read));
};

/**
 * For testing purposes, TODO: remove
 */
exports.getUsers = function (req, res) {
  storage.getUsers(function (result) {
    res.send(result);
  });
};

exports.getUser = function (req, res) {
  var username = req.params.username;
  storage.getUser({'pryv.credentials.username': username}, function (user) {
    if (!user) {
      res.statusCode = 404;
      return res.send({error: 'no such user'});
    }
    res.send(user);
  });
};

exports.createUser = function (req, res) {
  //var username = req.params.username;
  var userData = req.body.user;
  storage.createUser(userData, function (err, user) {
    if (err) {
      res.statusCode = err;
    } else {
      res.statusCode = 201;
      twitter.streamUserTweets(userData);
    }
    res.send(user);
  });
};

exports.updateUser = function (req, res) {
  var username = req.params.username;
  storage.updateUser({'pryv.credentials.username': username},
    req.body, function (err, result) {
    if (err) {
      res.statusCode = err;
      return res.send({id: 'invalid-parameters-structure'});
    }
    twitter.streamUserTweets(result.data);
    res.send(result);
  });
};

exports.deleteUser = function (req, res) {
  storage.deleteUser(req.body, function (result) {
    res.send(result);
  });
};

exports.transferUserTimeline = function (req, res) {
  var username = req.params.username;
  var account = req.params.account;
  twitter.transferUserTimeline(username, account, function (err, data) {
    res.send(data);
  });
};

