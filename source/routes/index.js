var beta = require('../lib/beta'),
    pryvHelper = require('../lib/pryv'),
    config = require('../utils/config');

/*
 * Web app routes.
 */
module.exports = function (app) {
  app.get('/', function (req, res) {
    res.render('index', {
      domain: config.get('pryvdomain'),
      requestedPermissions: pryvHelper.requestedPermissions
    });
  });

  app.get('/prefs', beta.readPrefs);

  app.get('/auth', beta.authorize);

  app.get('/auth/callback', beta.callback);

  app.get('/signOut', beta.signOut);
};
