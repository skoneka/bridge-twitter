// TODO: move directly into routes

var storage = require('../storage/users'),
    twitter = require('./twitter'),
		OAuth = require('oauth').OAuth,
    winston = require('winston'),
    config = require('../utils/config');

var oAuth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  config.get('twitter:consumerKey'),
  config.get('twitter:consumerSecret'),
  '1.0a',
  config.get('twitter:callbackBaseURL') + '/auth/callback',
  'HMAC-SHA1'
);

exports.readPrefs = function (req, res) {
  if (typeof(req.query.username) === 'undefined' && typeof(req.session.username) === 'undefined') {
    // User not logged in
    return res.redirect('/');
  }

  // User info coming from GET url
  if (typeof(req.query.username) !== 'undefined') {
    req.session.username = req.query.username;
    req.session.appToken = req.query.appToken;
  }

  storage.getUser({'pryv.credentials.username': req.session.username}, function (user) {
    if (! user) {
      // user hasn't been created in the db yet
      winston.info('user not found, creating user in db...');
      var userData = {
        'twitter': {
          // TODO: check to remove this useless set of empty credentials
          'credentials': [{
            'accessToken': '',
            'accessSecret': '',
            'username': ''
          }],
          'filter': '+Y',
          'filterOption': 'all'
        },
        'pryv': {
          'streamId': 'social-twitter',
          'credentials': {
            'auth': req.session.appToken,
            'username': req.session.username,
            'isValid': true
          }
        }
      };
      storage.createUser(userData, function () {
        // TODO: proper error handling
        return res.redirect('/prefs');
      });
    } else {
      // user is already present in DB, let's update her info
      storage.updateUser({'pryv.credentials.username': req.session.username},
        {'pryv': {'credentials': {'auth': req.session.appToken, 'username': req.session.username,
        'isValid': true}}},
        function (err) {
          // TODO: proper error handling
          if (! err) {
            winston.info('info updated in db for user ' + req.session.username);
          }

          var instanceNum = 0;
          user.twitter.credentials.forEach(function (credential) {
            if (credential.accessToken !== '' && twitter.openedStreams[credential.username]) {
              ++instanceNum;
              twitter.openedStreams[credential.username].verifyCredentials(function (err) {
                --instanceNum;
                if (err) {
                  var condition = {'pryv.credentials.username': req.session.username};
                  storage.deleteUserTwitterAccount(condition,
                    credential.username, function (err) {
                    if (err) { winston.error(err); }
                  });
                }
              });
            }
          });
          res.render('prefs', {
            data: req.session,
            result: user,
            domain: config.get('pryvdomain')
          });
        });
    }
  });
};

exports.authorize = function (req, res) {
  oAuth.getOAuthRequestToken(function (err, oaToken, oaTokenSecret) {
    if (err) {
      // TODO: proper error handling
      winston.error(err);
      res.send('there was an error :/');
    }
    else {
      req.session.oauth = {};
      req.session.oauth.token = oaToken;
      req.session.oauth.token_secret = oaTokenSecret;
      res.redirect('https://twitter.com/oauth/authorize?oauth_token=' + oaToken);
    }
  });
};

exports.callback = function (req, res) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;

    oAuth.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
    function (error, oaToken, oaTokenSecret, results) {
      if (error) {
        winston.error(error);
        res.redirect('/prefs');
      } else {
        var condition = {'pryv.credentials.username': req.session.username};
        var update = {
          'accessToken': oaToken,
          'accessSecret': oaTokenSecret,
          'username': results.screen_name
        };
        storage.updateUserTwitterAccount(condition, update, function (err, result) {
          twitter.streamUserTweets(result.data);
          res.redirect('/prefs');
        });
      }
    }
    );
  }
};

exports.signOut = function (req, res) {
  req.session.destroy(); // Deletes the cookie.
  res.redirect('/');
};

