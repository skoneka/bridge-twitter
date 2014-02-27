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
						}]
					}
				}
			},
			'pryv': {
				type: 'object',
				required : isRequired === action.CREATE,
				properties : {
					'streamId': {
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
	};
	return schema;
};

var action = {
  CREATE: 'create'
};
Object.freeze(action);
