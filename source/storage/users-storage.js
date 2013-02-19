/*
 * Wrapper around mongoose API
 */

var mongoose = require('mongoose'),
		config = require('../utils/config'),
		util = require('util');

mongoose.connect('localhost', 'tg');

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//   console.log('connected to db...');
// });

var JSONSchema = {
	"title": "User Settings Schema",
	"type": "object",
	"properties": {
		"twitter": {
			"type": "object",
			"properties": {
				"filter": {
					"type": "string"
				},
				"filterIsActive": {
					"type": "boolean"
				},
				"credentials": {
					"type": "object",
					"properties": {
						"access_token_key": {
							"type":"string"
						},
						"access_token_secret": {
							"type":"string"
						},
						"consumer_key": {
							"type":"string"
						},
						"consumer_secret": {
							"type":"string"
						},
						"username": {
							"type":"string"
						}
					}
				}
			}
		},
		"pryv": {
			"type": "object",
			"properties": {
				"channelId": {
					"type": "string"
				},
				"folderId": {
					"type": "string"
				},
				"credentials": {
					"type": "object",
					"properties": {
						"username": {
							"type": "string"
						},
						"auth": {
							"type": "string"
						}
					}
				}
			}
		}
	}
}
module.exports.JSONSchema = JSONSchema;

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
  var usr = new User(user);
  usr.save(function (err) {
    if (err) return done({'error':err});
    done({'ok':usr._id});
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

// exports.updateUser = function(conditions, update, done) {
// 	var options = { multi: true };
// 	User.update(conditions, update, options, function(err, numAffected){
// 		if (err) return done({'error':err});
// 		if (!numAffected) return done({'error':'nothing changed'});
// 		done({'ok':'updated','numAffected':numAffected});
// 	});
// };


exports.updateUser = function(conditions, update, done) {
	User.update(conditions, { $set: update }, function(err, numAffected){
		if (err) return done({'error':err});
		if (!numAffected) return done({'error':'nothing changed'});
		done({'ok':'updated','numAffected':numAffected});
	});
};

exports.readSchema = function(done) {
	done(JSONSchema);
};
