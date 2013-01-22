var tg = require('../lib/twitter-gateway');

exports.userTimeline = function(req, res){
  var username = req.params.username;
  tg.transferUserTimeline(username, function(err, data) {
  	res.send(data);
  });
};