var gateway = require('../lib/gateway');

/**
 * API call routes.
 */
module.exports = api;

function api(app) {
	app.get('/auth-process-details', gateway.authProcessDetails);
	app.post('/user-settings', gateway.createUser);
	app.get('/user-settings/:username', gateway.readUser);
  /*jshint -W024*/
	app.delete('/user-settings', gateway.deleteUser);
	app.put('/user-settings/:username', gateway.updateUser);
	app.get('/user-settings-schema', gateway.readSchema);
	app.get('/user-timeline/:username/:account', gateway.transferUserTimeline);
	app.get('/users', gateway.listUsers); //for testing purposes
}
