// TODO: see for moving appropriate bits directly into routes

var Twitter = require('ntwitter'),
    storage = require('../storage/users'),
    config = require('../utils/config'),
    pryv = require('./pryv'),
    logger = require('winston'),
    timestamp = require('unix-timestamp');

var openedStreams = exports.openedStreams = {};

exports.streamTweetsFromExistingUsers = function (users) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].pryv.credentials.isValid) {
      streamUserTweets(users[i]);
    }
  }
};

function streamUserTweets(user) {
  //TODO: don't declare functions in loops
  var currentTwitterUsername;
  for (var i = 0, len = user.twitter.credentials.length; i < len; i++) {
    if (! user.twitter.credentials[i].accessToken) { continue; }

    currentTwitterUsername = user.twitter.credentials[i].username;

    //if the stream was already opened, kill it
    if (openedStreams[currentTwitterUsername]) {
      openedStreams[currentTwitterUsername].streamRef.destroy();
    }

    openedStreams[currentTwitterUsername] = new Twitter({
      consumer_key: config.get('twitter:consumerKey'),
      consumer_secret: config.get('twitter:consumerSecret'),
      access_token_key: user.twitter.credentials[i].accessToken,
      access_token_secret: user.twitter.credentials[i].accessSecret
    });
    var condition = {track: user.twitter.credentials[i].username};
    openedStreams[currentTwitterUsername].stream('user', condition,
        onStreamOpen.bind(null, currentTwitterUsername));
  }

  function onStreamOpen(twitterUsername, stream) {
    openedStreams[twitterUsername].streamRef = stream;
    stream.on('data', onStreamData);
    stream.on('error', onStreamError);
  }

  function onStreamData(data) {
    if (data.event === 'favorite' || data.text) {
      pryv.forwardTweet(user, data, function (err, createdEvent) {
        if (err) {
          return logger.error(err);
        }
        if (createdEvent) {
          logger.info('Tweet successfully stored on Pryv with id ' + createdEvent.id);
        }
      });
    }
  }

  function onStreamError(error, code) {
    logger.error(error + ': ' + code);
  }
}
exports.streamUserTweets = streamUserTweets;

exports.transferUserTimeline = function (username, account, done) {
  getUserTimeline(username, account, formatUserTimeline, done);
};

function getUserTimeline(username, account, next, done) {
  var data = [];
  getUserData(username.toLowerCase(), function (user) {
    if (! user) {
      return done('user not found', data);
    }

    var credentials = {};
    for (var i = 0; i < user.twitter.credentials.length; i++) {
      var currentCredentials = user.twitter.credentials[i];
      if (currentCredentials.accessToken === '') { continue; }
      if (currentCredentials.username.toLowerCase() === account.toLowerCase()) {
        credentials = currentCredentials;
        break;
      }
    }
    var twitter = new Twitter({
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

      twitter.getUserTimeline(args, onTimeline);

      function onTimeline(err, chunk) {
        if (err) {
          logger.error('Twitter search failed: ' + err);
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
exports.getUserTimeline = getUserTimeline;

function formatUserTimeline(user, data, next, done) {
  var tweetsHistory = [];

  for (var i = 0, len = data.length; i < len; i++) {
    var currentTweet = data[i];
    var tweet = {
      time: timestamp.fromDate(currentTweet.created_at),
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
exports.formatUserTimeline = formatUserTimeline;

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
  storage.getUser({'pryv.credentials.username': username}, function (result) {
    done(result);
  });
}
exports.getUserData = getUserData;
