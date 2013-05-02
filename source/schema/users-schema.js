module.exports = function(isRequired) {
	var schema = {
		type : 'object',
		properties : {
			'twitter': {
				type: 'object',
				required : isRequired === action.CREATE,
				properties : {
					'filter': {
						type: 'string'
					},
					'filterOption': {
						type: 'string'
					},
					'credentials': {
						type: 'array',
						required : isRequired === action.CREATE,
						items: {
							type : 'object',
							properties : {
								'accessToken': {
									type:'string',
									required : isRequired === action.CREATE
								},
								'accessSecret': {
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


// FIXME:
// remove app token and secret
// add twitter user id
