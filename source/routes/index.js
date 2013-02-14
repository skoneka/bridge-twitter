
/*
 * GET home page.
 */

module.exports = index;

function index(app) {
	app.get('/', renderIndex);

	function renderIndex(req, res){
	  res.render('index');
	};
}