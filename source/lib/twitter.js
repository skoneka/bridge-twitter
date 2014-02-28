var twitter = require('ntwitter'),
    usersStorage = require('../storage/users-storage'),
    config = require('../utils/config'),
    pryv = require('./pryv'),
    winston = require('winston');

var openedStreams = {};
module.exports.openedStreams = openedStreams;

exports.streamTweetsFromExistingUsers = function (users) {
  for (var i = 0, len = users.length; i < len; i++) {
    streamUserTweets(users[i]);
  }
};

function streamUserTweets(user) {
  //TODO: don't declare functions in loops
  for (var i = 0; i < user.twitter.credentials.length; i++) {
    if (user.twitter.credentials[i].accessToken === '') { continue; }
    var currentTwitterUsername = user.twitter.credentials[i].username;

    //if the stream was already opened, kill it and remove its reference
    if (typeof openedStreams[currentTwitterUsername] !== 'undefined') {
      openedStreams[currentTwitterUsername].streamRef.destroy();
      delete openedStreams[currentTwitterUsername];
    }

    openedStreams[currentTwitterUsername] = new twitter({
      consumer_key: config.get('twitter:consumerKey'),
      consumer_secret: config.get('twitter:consumerSecret'),
      access_token_key: user.twitter.credentials[i].accessToken,
      access_token_secret: user.twitter.credentials[i].accessSecret
    });
    var condition = {track: user.twitter.credentials[i].username};
    openedStreams[currentTwitterUsername].stream('user', condition, function (stream) {
      openedStreams[currentTwitterUsername].streamRef = stream;
      stream.on('data', function (data) {
        if (data.event === 'favorite' || data.text) {
          pryv.forwardTweet(user, data, function (err, createdEvent) {
            if (err) {
              return winston.warn(err);
            }
            winston.info('Tweet successfully stored on Pryv with id ' + createdEvent.id);
          });
        }
      });
      stream.on('error', function (error, code) {
        winston.error(error + ': ' + code);
      });
    });
  }
}
module.exports.streamUserTweets = streamUserTweets;

exports.transferUserTimeline = function (username, account, done) {

  getUserTimeline(username, account, formatUserTimeline, done);
};

function getUserTimeline(username, account, next, done) {

  var data = [];
  getUserData(username.toLowerCase(), function (user) {
    if (!user) { return done('user not found', data); }
    var credentials = {};
    for (var i = 0; i < user.twitter.credentials.length; i++) {
      var currentCredentials = user.twitter.credentials[i];
      if (currentCredentials.accessToken === '') { continue; }
      if (currentCredentials.username.toLowerCase() === account.toLowerCase()) {
        credentials = currentCredentials;
        break;
      }
    }
    var twit = new twitter({
      consumer_key: config.get('twitter:consumerKey'),
      consumer_secret: config.get('twitter:consumerSecret'),
      access_token_key: credentials.accessToken,
      access_token_secret: credentials.accessSecret
    });

    search();

    function search(lastId) {
      var args = {
        screen_name: credentials.username,
        count: 200,
        include_rts: 1
      };
      // Do not include this property on the first iteration
      if (lastId) { args.max_id = lastId; }

      twit.getUserTimeline(args, onTimeline);

      function onTimeline(err, chunk) {
        if (err) {
          winston.error('Twitter search failed: ' + err);
          return done(err);
        }

        if (!chunk.length) {
          //User has not tweeted yet
          return done(undefined, {});
        }

        // Get rid of the first element of each iteration (except for the first iteration)
        if (data.length) { chunk.shift(); }

        data = data.concat(chunk);
        var thisId = parseInt(data[data.length - 1].id_str, 10);
        if (chunk.length && data.length >= 200) { return search(thisId); }

        // Results must be filtered ?
        if (user && user.twitter.filterOption === 'filter') {
          data = filterTweetsFromHistory(data, user.twitter.filter);
        }

        // Only import favorited tweets ?
        if (user && user.twitter.filterOption === 'favorite') {
          data = selectFavsFromHistory(data);
        }

        // end the operations if there are no tweets left to forward
        if (data.length === 0) { return done(undefined, {}); }
        next(user, data, pryv.forwardTweetsHistory, done);
      }
    }
  });
}
module.exports.getUserTimeline = getUserTimeline;


function formatUserTimeline(user, data, next, done) {

  console.dir(data);

  var tweetsHistory = [];

  for (var i = 0, len = data.length; i < len; i++) {
    var currentTweet = data[i];
    var tweet = {
      time: pryv.toTimestamp(currentTweet.created_at),
      tempRefId: i.toString(),
      streamId: user.pryv.streamId,
      type: 'message/twitter',
      content: {
        id: currentTweet.id_str,
        'screen-name': currentTweet.user.screen_name,
        text: currentTweet.text
      }
    };
    tweetsHistory.push(tweet);
  }
  tweetsHistory = JSON.stringify(tweetsHistory);
  next(user.pryv, tweetsHistory, done);
}
module.exports.formatUserTimeline = formatUserTimeline;

function filterTweetsFromHistory(collection, query) {
  var newCollection = [];

  for (var i = 0, len = collection.length; i < len; i++) {
    var item = collection[i];
    if (item.text.indexOf(query) !== -1) {
      newCollection.push(item);
    }
  }
  return newCollection;
}

function selectFavsFromHistory(collection, query) {
  var newCollection = [];

  for (var i = 0, len = collection.length; i < len; i++) {
    var item = collection[i];

    if (item.text.indexOf(query) !== -1) {
      newCollection.push(item);
    }
  }
  return newCollection;
}

function getUserData(username, done) {
  usersStorage.readUser({'pryv.credentials.username': username}, function (result) {
    done(result);
  });
}
module.exports.getUserData = getUserData;
