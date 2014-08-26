var storage = require('../storage/users'),
    schema = require('../storage/schema'),
    twitter = require('../lib/twitter'),
    pryvHelper = require('../lib/pryv'),
    _ = require('lodash');

/**
 * External API routes.
 * Require caller to have authorized origin.
 */
module.exports = function (app) {

	app.get('/auth-process-details', function (req, res) {
    var response = {
      url: 'https://api.twitter.com/oauth/authorize',
      info: 'pryv\'s token must be provided'
    };
    res.send(response);
  });

	app.get('/users', function (req, res) {
    storage.getUsers(function (result) {
      res.send(result);
    });
  }); //for testing purposes, TODO: remove

  // TODO: rename those to "users"?

  app.get('/user-settings/:username', function (req, res) {
    var username = req.params.username;
    storage.getUser({'pryv.credentials.username': username}, function (user) {
      if (!user) {
        res.statusCode = 404;
        return res.send({error: 'no such user'});
      }
      res.send(user);
    });
  });

	app.post('/user-settings', function (req, res) {
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
  });

	app.put('/user-settings/:username', function (req, res) {
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
  });

  /*jshint -W024*/
	app.delete('/user-settings', function (req, res) {
    storage.deleteUser(req.body, function (result) {
      res.send(result);
    });
  });

	app.get('/user-settings-schema', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.send(schema.json(schema.Action.Read));
  });

  // TODO: review this (GET looks wrong)
	app.get('/user-timeline/:username/:account', function (req, res) {
    var username = req.params.username;
    var account = req.params.account;
    twitter.transferUserTimeline(username, account, function (err, data) {
      res.send(data);
    });
  });

  app.get('/requested-permissions', checkAuth, function (req, res) {
    res.send(200, {
      permissions: pryvHelper.requestedPermissions
    });
  });

  var authorizedOrigins = [/^https:\/\/\S*.pryv.me$/];

  function checkAuth(req, res, next) {
    var origin = req.headers.origin;
    if (! origin || ! _.some(authorizedOrigins, function(ao) { return ao.test(origin); })) {
      return res.send(401, {
        error: {
          id: 'unauthorized',
          message: 'Missing authentication'
        }
      });
    }
    next();
  }

};
