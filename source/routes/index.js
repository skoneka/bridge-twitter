
/*
 * GET home page.
 */

module.exports = index;

var beta = require('../lib/beta');

function index(app) {
	app.get('/', renderIndex);

	function renderIndex(req, res){
	  res.render('index');
	};


	app.get('/beta', beta.createUser);
	app.get('/prefs', beta.readPrefs);
	app.get('/auth', beta.authorize);
	app.get('/auth/callback', beta.callback);

}