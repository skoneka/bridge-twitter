/*
 * Wrapper around mongoose API
 */

var mongoose = require('mongoose'),
    config = require('../utils/config'),
    JSV = require('JSV').JSV,
    usersSchema = require('../schema/users-schema'),
      winston = require('winston');

mongoose.connect('mongodb://' + config.get('database:host') +
	'/' + config.get('database:name'), function (err) {
  if (err) { winston.error(err); }
});


// 
// SCHEMA is defined below (mongoose) AND in /schema (JSV)
// 
  
var schema = mongoose.Schema({
  pryv: {
    credentials: {
      username: String,
      auth: String,
      isValid: Boolean
    },
    streamId: String
  },
  twitter: {
    credentials: [{
      username: String,
      accessToken: String,
      accessSecret: String
    }],
    filter: String,
    filterOption: String
  }
});

var User = mongoose.model('users', schema);

exports.listUsers = function (done) {
  User.find({}, function (err, doc) {
    if (err) { return done({'error': err}); }
    done(doc);
  });
};

exports.createUser = function (user, done) {
  var env = JSV.createEnvironment();
  var report = env.validate(user, usersSchema('create'));
  if (report.errors.length !== 0) {
    return done(400, {
      'id': 'invalid-parameters-structure',
      'message': 'check the structure of the provided JSON',
      'data': report.errors
    });
  }
  var usr = new User(user);
  usr.save(function (err) {
    if (err) { return done({'error': err}); }
    done(undefined, {'ok': usr._id});
  });
};

exports.deleteUser = function (conditions, done) {
  User.remove(conditions, function (err, numAffected) {
    if (err) { return done({'error': err}); }
    if (!numAffected) { return done({'error': 'nothing changed'}); }
    done({'ok': 'deleted', 'numAffected': numAffected});
  });
};

exports.readUser = function (conditions, done) {
  User.findOne(conditions, function (err, doc) {
    if (err) { return done({'error': err}); }
    done(doc);
  });
};

exports.updateUser = function (conditions, update, done) {

  var env = JSV.createEnvironment();
  var report = env.validate(update, usersSchema());
  if (report.errors.length !== 0) {
    return done(400, {
      'id': 'invalid-parameters-structure',
      'message': 'check the structure of the provided JSON',
      'data': report.errors
    });
  }
  User.findOne(conditions, function (err, doc) {
    if (err) { return done({'error': err}); }
    for (var prop in update) {
      if (update.hasOwnProperty(prop)) {
        for (var propt in update[prop]) {
          if (update[prop].hasOwnProperty(propt)) {
            doc[prop][propt] = update[prop][propt];
          }
        }
      }
    }
    doc.save(function (err, data) {
      if (err) { return winston.error(err); }
      done(undefined, {'ok': 'updated', 'data': data});
    });
  });
};

exports.updateUserTwitterAccount = function (conditions, update, done) {

  User.findOne(conditions, function (err, doc) {
    if (err) { return done({'error': err}); }
    for (var i = 0; i < doc.twitter.credentials.length; i++) {
      if (doc.twitter.credentials[i].username === update.username) {
        doc.twitter.credentials.splice(i, 1);
      }
    }
    doc.twitter.credentials.push(update);
    doc.save(function (err, data) {
      if (err) { return winston.error(err); }
      done(undefined, {'ok': 'updated', 'data': data});
    });
  });
};

exports.deleteUserTwitterAccount = function (conditions, username, done) {

  User.findOne(conditions, function (err, doc) {
    if (err) { return done({'error': err}); }
    for (var i = 0; i < doc.twitter.credentials.length; i++) {
      if (doc.twitter.credentials[i].username === username) {
        doc.twitter.credentials.splice(i, 1);
      }
    }
    doc.save(function (err) {
      if (err) { return winston.error(err); }
    });
  });
};

exports.readSchema = function (done) {
  done(usersSchema('create'));
};
