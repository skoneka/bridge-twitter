/*
 * Wrapper around mongoose API
 * TODO: turn into function with deps passed as params
 */

var mongoose = require('mongoose'),
    config = require('../utils/config'),
    // TODO: replace obsolete JSV with z-schema
    JSV = require('JSV').JSV,
    schema = require('./schema'),
    logger = require('winston');

mongoose.connect('mongodb://' + config.get('database:host') +
	'/' + config.get('database:name'), function (err) {
  if (err) { logger.error(err); }
});


var User = mongoose.model('users', schema.mongoose);

exports.getUsers = function (done) {
  User.find({}, function (err, users) {
    if (err) { return done({'error': err}); }
    done(users);
  });
};

exports.getUser = function (query, done) {
  User.findOne(query, function (err, user) {
    if (err) { return done({'error': err}); }
    done(user);
  });
};

exports.createUser = function (userData, done) {
  var env = JSV.createEnvironment();
  var report = env.validate(userData, schema.json(schema.Action.Create));
  if (report.errors.length !== 0) {
    return done(400, {
      'id': 'invalid-parameters-structure',
      'message': 'check the structure of the provided JSON',
      'data': report.errors
    });
  }
  var user = new User(userData);
  user.save(function (err) {
    if (err) { return done({'error': err}); }
    done(undefined, {'ok': user._id});
  });
};

exports.updateUser = function (query, update, done) {
  var env = JSV.createEnvironment();
  var report = env.validate(update, schema.json(schema.Action.Update));
  if (report.errors.length !== 0) {
    return done(400, {
      'id': 'invalid-parameters-structure',
      'message': 'check the structure of the provided JSON',
      'data': report.errors
    });
  }
  User.findOne(query, function (err, user) {
    if (err) { return done({'error': err}); }
    for (var prop in update) {
      if (update.hasOwnProperty(prop)) {
        for (var propt in update[prop]) {
          if (update[prop].hasOwnProperty(propt)) {
            user[prop][propt] = update[prop][propt];
          }
        }
      }
    }
    user.save(function (err, data) {
      if (err) { return logger.error(err); }
      done(undefined, {'ok': 'updated', 'data': data});
    });
  });
};

exports.updateUserTwitterAccount = function (query, update, done) {
  User.findOne(query, function (err, user) {
    if (err) { return done({'error': err}); }
    for (var i = 0; i < user.twitter.credentials.length; i++) {
      if (user.twitter.credentials[i].username === update.username) {
        user.twitter.credentials.splice(i, 1);
      }
    }
    user.twitter.credentials.push(update);
    user.save(function (err, data) {
      if (err) { return logger.error(err); }
      done(undefined, {'ok': 'updated', 'data': data});
    });
  });
};

exports.deleteUserTwitterAccount = function (query, username, done) {
  User.findOne(query, function (err, user) {
    if (err) { return done({'error': err}); }
    for (var i = 0; i < user.twitter.credentials.length; i++) {
      if (user.twitter.credentials[i].username === username) {
        user.twitter.credentials.splice(i, 1);
      }
    }
    user.save(function (err) {
      if (err) { return logger.error(err); }
    });
  });
};

exports.deleteUser = function (query, done) {
  User.remove(query, function (err, numAffected) {
    if (err) { return done({'error': err}); }
    if (! numAffected) { return done({'error': 'nothing changed'}); }
    done({'ok': 'deleted', 'numAffected': numAffected});
  });
};
