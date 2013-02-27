module.exports = function(isRequired) {
	var schema = {
		type : 'object',
		additionalProperties : false,
		properties : {
			'twitter': {
				type: 'object',
				required : isRequired === action.CREATE,
				properties : {
					'filter': {
						type: 'string'
					},
					'filterIsActive': {
						type: 'boolean'
					},
					'credentials': {
						type: 'object',
						required : isRequired === action.CREATE,
						properties: {
							'access_token_key': {
								type:'string',
								required : isRequired === action.CREATE
							},
							'access_token_secret': {
								type:'string',
								required : isRequired === action.CREATE
							},
							'consumer_key': {
								type:'string',
								required : isRequired === action.CREATE
							},
							'consumer_secret': {
								type:'string',
								required : isRequired === action.CREATE
							},
							'username': {
								type:'string',
								required : isRequired === action.CREATE
							}
						}
					}
				}
			},
			'pryv': {
				type: 'object',
				required : isRequired === action.CREATE,
				properties : {
					'channelId': {
						type: 'string',
						required : isRequired === action.CREATE
					},
					'folderId': {
						type: 'string',
						required : isRequired === action.CREATE
					},
					'credentials': {
						type: 'object',
						required : isRequired === action.CREATE,
						properties: {
							'username': {
								type: 'string',
								required : isRequired === action.CREATE
							},
							'auth': {
								type: 'string',
								required : isRequired === action.CREATE
							}
						}
					}
				}
			}
		}
	}
	return schema;
}

var action = {
  CREATE: 'create'
};
Object.freeze(action);