/*
 * Wrapper around mongoose API
 */

var mongoose = require('mongoose'),
		config = require('../utils/config'),
		util = require('util'),
		JSV = require('JSV').JSV,
		usersSchema = require('../schema/users-schema'),
		_ = require('lodash');

mongoose.connect('localhost', 'tg');

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//   console.log('connected to db...');
// });

var schema = mongoose.Schema({
	pryv: {
		credentials: {
			username: String,
			auth: String
		},
		channelId: String,
		folderId: String
	},
	twitter: {
		credentials: {
			username: String,
			consumer_key: String,
			consumer_secret: String,
			access_token_key: String,
			access_token_secret: String,
		},
		filter: String,
		filterIsActive: Boolean
	}
});

var User = mongoose.model('users', schema);

exports.listUsers = function(done) {
	User.find({}, function (err, doc){
		if (err) return done({'error':err});
		done(doc);
	});
};

exports.createUser = function(user, done) {
	var env = JSV.createEnvironment();
	var report = env.validate(user, usersSchema('create'));
	if (report.errors.length !== 0) {
		return done(400, { 'id': 'invalid-parameters-structure', 'message': 'check the structure of the provided JSON', 'data': report.errors });
	}
  var usr = new User(user);
  usr.save(function (err) {
    if (err) return done(res, {'error':err});
    done(undefined, {'ok':usr._id});
  });
};

exports.deleteUser = function(conditions, done) {
	User.remove(conditions, function(err, numAffected) {
	  if (err) return done({'error':err});
	  if (!numAffected) return done({'error':'nothing changed'});
		done({'ok':'deleted','numAffected':numAffected});
	});
};

exports.readUser = function(conditions, done) {
	User.findOne(conditions, function (err, doc){
		if (err) return done({'error':err});
		done(doc);
	});
};

exports.updateUser = function(conditions, update, done) {
	var env = JSV.createEnvironment();
	var report = env.validate(update, usersSchema());
	// console.dir(report.errors);
	if (report.errors.length !== 0) {
		return done(400, { 'id': 'invalid-parameters-structure', 'message': 'check the structure of the provided JSON', 'data': report.errors });
	}
	User.findOne(conditions, function (err, doc){
		if (err) return done({'error':err});
		for(var prop in update) {
		  if(update.hasOwnProperty(prop)) {
		    for(var propt in update[prop]) {
		    	if(update[prop].hasOwnProperty(propt)) {
		    		doc[prop][propt] = update[prop][propt];
		    	}
		    }
		  }
		}
		doc.save();
		done(undefined, {'ok':'updated'});
	});
};

exports.readSchema = function(done) {
	done(usersSchema('create'));
};
