var usersStorage = require('../storage/users-storage'),
    twitter = require('./twitter'),
		OAuth= require('oauth').OAuth,
    winston = require('winston'),
    config = require('../utils/config'),
		oa = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "K03u8c1F76VYi5X9GF0oLQ",
      "x89NwVNcqFqtlzvykgdXIHUA7XdGqGOk661JLZQ0",
      "1.0a",
      'http://'+config.get('http:domain')+':'+config.get('http:port')+'/auth/callback',
      "HMAC-SHA1"
    );

exports.createUser = function(req, res) {
  if (typeof(req.query.username) !== 'undefined') req.session.username = req.query.username;
  if (typeof(req.query.appToken) !== 'undefined') req.session.appToken = req.query.appToken;

	usersStorage.readUser({'pryv.credentials.username':req.query.username}, function(result){
    if (!result) {
	    var user = {
	      'twitter': {
	        'filter': '+Y',
	        'filterIsActive': '',
	        'credentials': {
	          'accessToken': '',
	          'accessSecret': '',
	          'username': ''
	        }
	      },
	      'pryv': {
	        'channelId': 'diary',
	        'folderId': 'social-twitter',
	        'credentials': {
	          'auth': req.session.appToken,
	          'username': req.session.username
	        }
	      }
	    };
      usersStorage.createUser(user, function(err, result){
        twitter.streamUserTweets(user);
		    res.render('beta', {data: req.session, result: result});
  	  });
    } else {
      usersStorage.updateUser({'pryv.credentials.username':req.session.username}, {'pryv':{'credentials':{'auth':req.session.appToken,'username':req.session.username}}}, function(err, result){
        res.render('beta', {data: req.session, result: result});
      });
    }
  });
};

exports.readPrefs = function(req, res) {
	usersStorage.readUser({'pryv.credentials.username':req.session.username}, function(result){
    if (!result) return res.redirect('/');
    if (!twitter.openedStreams.hasOwnProperty(req.session.username)) return res.render('prefs', {data: req.session, result: result});
    twitter.openedStreams[req.session.username].verifyCredentials(function(err, data){
      if (err) {
        usersStorage.updateUser({'pryv.credentials.username':req.session.username}, {'twitter':{'credentials':{'accessToken':'','accessSecret':''}}}, function(err, result){
          return res.render('prefs', {data: req.session, result: result.data});
        });
      }
      res.render('prefs', {data: req.session, result: result});
    });
  });
};

exports.authorize = function(req, res) {
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) {
      winston.error(error);
      res.send("there was an error :/")
    }
    else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      req.session.oauth.token_secret = oauth_token_secret;
      res.redirect('https://twitter.com/oauth/authorize?oauth_token='+oauth_token);
  }
  });
};

exports.callback = function(req, res) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;

    oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
    function(error, oauth_access_token, oauth_access_token_secret, results){
      if (error){
        winston.error(error);
        res.redirect('/prefs');
      } else {
        usersStorage.updateUser({'pryv.credentials.username':req.session.username}, {'twitter':{'credentials':{'accessToken':oauth_access_token,'accessSecret':oauth_access_token_secret,'username':results.screen_name}}}, function(err, result){
          twitter.streamUserTweets(result.data);
          res.redirect('/prefs');
        });
      }
    }
    );
  } else next(new Error("you're not supposed to be here."))
};
