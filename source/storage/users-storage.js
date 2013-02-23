/*
 * Wrapper around mongoose API
 */

var mongoose = require('mongoose'),
		config = require('../utils/config'),
		util = require('util'),
		JSV = require('JSV').JSV;

mongoose.connect('localhost', 'tg');

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//   console.log('connected to db...');
// });

var JSONSchema = {
	title: 'User Settings Schema',
	type: 'object',
	properties: {
		'twitter': {
			type: 'object',
			properties: {
				'filter': {
					type: 'string'
				},
				'filterIsActive': {
					type: 'boolean'
				},
				'credentials': {
					type: 'object',
					required: true,
					properties: {
						'access_token_key': {
							type:'string',
							required: true
						},
						'access_token_secret': {
							type:'string',
							required: true
						},
						'consumer_key': {
							type:'string',
							required: true
						},
						'consumer_secret': {
							type:'string',
							required: true
						},
						'username': {
							type:'string',
							required: true
						}
					}
				}
			}
		},
		'pryv': {
			type: 'object',
			properties: {
				'channelId': {
					type: 'string',
					required: true
				},
				'folderId': {
					type: 'string',
					required: true
				},
				'credentials': {
					type: 'object',
					required: true,
					properties: {
						'username': {
							type: 'string',
							required: true
						},
						'auth': {
							type: 'string',
							required: true
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
	var env = JSV.createEnvironment();
	var report = env.validate(user, JSONSchema);
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

// exports.updateUser = function(conditions, update, done) {
// 	User.update(conditions, { $set: update }, function(err, numAffected){
// 		if (err) return done({'error':err});
// 		if (!numAffected) return done({'error':'nothing changed'});
// 		done({'ok':'updated','numAffected':numAffected});
// 	});
// };

exports.updateUser = function(conditions, update, done) {
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
		done({'ok':'updated'});
	});
};

exports.readSchema = function(done) {
	done(JSONSchema);
};
