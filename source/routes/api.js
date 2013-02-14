
/*
 * API calls.
 */

var gateway = require('../lib/gateway');

module.exports = api;

function api(app) {

	app.get('/auth-process-details', gateway.authProcessDetails);
	app.post('/user-settings', gateway.createUser);
	app.get('/user-settings/:username', gateway.readUser);
	app.put('/user-settings/:username', gateway.updateUser);
	app.get('/user-settings-schema', gateway.readSchema);
	app.get('/user-timeline/:username', gateway.transferUserTimeline);
	app.get('/users', gateway.listUsers); //for testing purposes
}