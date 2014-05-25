/**
 * Users storage structure, in both JSON schema (API use) and Mongoose (internal use) formats.
 * TODO: only expose pre-built schemas for possible actions (instead of re-creating everytime)
 */

var mongoose = require('mongoose');

var Action = exports.Action = {
  Read: 'read',
  Create: 'create',
  Update: 'update'
};
Object.freeze(Action);

exports.json = function (action) {
	return {
		type : 'object',
		additionalProperties : false,
		properties : {
			'twitter': {
				type: 'object',
				required : action === Action.Read || action === Action.Create,
				properties : {
					'filter': {
						type: 'string'
					},
					'filterOption': {
						type: 'string'
					},
					'credentials': {
						type: 'array',
						items: [{
							type : 'object',
							minItems : 0,
							maxItems : 10,
							properties : {
								'accessToken': {
									type: 'string',
									required : action === Action.Read || action === Action.Create
								},
								'accessSecret': {
									type: 'string',
									required : action === Action.Read || action === Action.Create
								},
								'username': {
									type: 'string',
									required : action === Action.Read || action === Action.Create
								}
							}
						}]
					}
				}
			},
			'pryv': {
				type: 'object',
				required : action === Action.Read || action === Action.Create,
				properties : {
					'streamId': {
						type: 'string',
						required : action === Action.Read || action === Action.Create
					},
					'credentials': {
						type: 'object',
						required : action === Action.Read || action === Action.Create,
						properties: {
							'username': {
								type: 'string',
								required : action === Action.Read || action === Action.Create
							},
							'auth': {
								type: 'string',
								required : action === Action.Read || action === Action.Create
							},
							'isValid': {
								type: 'boolean',
								required : action === Action.Read || action === Action.Create
							}
						}
					}
				}
			}
		}
	};
};

exports.mongoose = mongoose.Schema({
  twitter: {
    filter: String,
    filterOption: String,
    credentials: [{
      username: String,
      accessToken: String,
      accessSecret: String
    }]
  },
  pryv: {
    streamId: String,
    credentials: {
      username: String,
      auth: String,
      isValid: Boolean
    }
  }
});
