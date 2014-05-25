var gateway = require('../lib/gateway');

/**
 * External API routes.
 */
module.exports = function (app) {
	app.get('/auth-process-details', gateway.authProcessDetails);

	app.get('/users', gateway.getUsers); //for testing purposes

  // TODO: rename those to "users"

  app.get('/user-settings/:username', gateway.getUser);

	app.post('/user-settings', gateway.createUser);

	app.put('/user-settings/:username', gateway.updateUser);

  /*jshint -W024*/
	app.delete('/user-settings', gateway.deleteUser);

	app.get('/user-settings-schema', gateway.readSchema);

  // TODO: review this (GET looks wrong)
	app.get('/user-timeline/:username/:account', gateway.transferUserTimeline);
};
