var usersStorage = require('../storage/users-storage'),
    twitter = require('./twitter'),
		OAuth = require('oauth').OAuth,
    winston = require('winston'),
    config = require('../utils/config'),
		oa = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.get('twitter:consumerKey'),
      config.get('twitter:consumerSecret'),
      '1.0a',
      config.get('twitter:callbackBaseURL') + '/auth/callback',
      'HMAC-SHA1'
    );

exports.readPrefs = function (req, res) {

  //User not logged in
  if (typeof(req.query.username) === 'undefined' && typeof(req.session.username) === 'undefined') {
    return res.redirect('/');
  }

  //User info comming from GET url
  if (typeof(req.query.username) !== 'undefined') {
    req.session.username = req.query.username;
    req.session.appToken = req.query.appToken;
  }

  usersStorage.readUser({'pryv.credentials.username': req.session.username}, function (result) {
    // user hasn't been created in the db yet
    if (!result) {
      winston.info('user not found, creating user in db...');
      var user = {
        'twitter': {
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
      usersStorage.createUser(user, function () {
        return res.redirect('/prefs');
      });

    //user is already present in DB, let's update her info
    } else {
      usersStorage.updateUser({'pryv.credentials.username': req.session.username},
        {'pryv': {'credentials': {'auth': req.session.appToken, 'username': req.session.username,
        'isValid': true}}},
        function (err, result2) {
          if (!err) {
            winston.info('info updated in db for user ' + req.session.username);
          }

          var instanceNum = 0;
          result.twitter.credentials.forEach(function (credential) {
            if (credential.accessToken !== '' && twitter.openedStreams[credential.username]) {
              ++instanceNum;
              twitter.openedStreams[credential.username].verifyCredentials(function (err) {
                --instanceNum;
                if (err) {
                  var condition = {'pryv.credentials.username': req.session.username};
                  usersStorage.deleteUserTwitterAccount(condition,
                    credential.username, function (err) {
                    if (err) { winston.error(err); }
                  });
                }
              });
            }
          });
          res.render('prefs', {
            data: req.session,
            result: result,
            domain: config.get('pryvdomain')
          });
        });
    }
  });
};

exports.authorize = function (req, res) {
  oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret) {
    if (error) {
      winston.error(error);
      res.send('there was an error :/');
    }
    else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      req.session.oauth.token_secret = oauth_token_secret;
      res.redirect('https://twitter.com/oauth/authorize?oauth_token=' + oauth_token);
    }
  });
};

exports.callback = function (req, res) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;

    oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
    function (error, oauth_access_token, oauth_access_token_secret, results) {
      if (error) {
        winston.error(error);
        res.redirect('/prefs');
      } else {
        var condition = {'pryv.credentials.username': req.session.username};
        var update = {
          'accessToken': oauth_access_token,
          'accessSecret': oauth_access_token_secret,
          'username': results.screen_name
        };
        usersStorage.updateUserTwitterAccount(condition, update, function (err, result) {
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

