
var twitter = require('ntwitter'),
    usersStorage = require('../storage/users-storage'),
    config = require('../utils/config'),
    pryv = require('./pryv'),
    winston = require('winston');

var openedStreams = {};
module.exports.openedStreams = openedStreams;

exports.streamTweetsFromExistingUsers = function(users) {
  var len = users.length;
  for (var i=0; i<len; i++ ) {
    streamUserTweets(users[i]);
  }
};

function streamUserTweets (user) {

  if (user.twitter.credentials.accessToken === '') return;
  var currentUsername = user.pryv.credentials.username;

  openedStreams[currentUsername] = new twitter({
    consumer_key: config.get('twitter:consumerKey'),
    consumer_secret: config.get('twitter:consumerSecret'),
    access_token_key: user.twitter.credentials.accessToken,
    access_token_secret: user.twitter.credentials.accessSecret
  });
  openedStreams[currentUsername].stream('user', {track:user.twitter.credentials.username}, function(stream) {
    stream.on('data', function (data) {
      pryv.forwardTweet(user.pryv, data, function(response) {
        winston.info('Tweet successfully stored on Pryv with id ' + response.id);
      });
    });
    stream.on('end', function (response) {
      // Handle a disconnection
    });
    stream.on('destroy', function (response) {
      // Handle a 'silent' disconnection from Twitter, no end/error event fired
    });
    stream.on('error', function(error, code) {
      winston.error(error + ': ' + code);
    });
  });
}
module.exports.streamUserTweets = streamUserTweets;

exports.transferUserTimeline = function(username, done) {

  getUserTimeline(username, formatUserTimeline, done);
};

function getUserTimeline(username, next, done) {

  var data = [];
  var user = getUserData(username.toLowerCase(), function(user){
    if (!user) return done('user not found', data);
    var twit = new twitter({
      consumer_key: config.get('twitter:consumerKey'),
      consumer_secret: config.get('twitter:consumerSecret'),
      access_token_key: user.twitter.credentials.accessToken,
      access_token_secret: user.twitter.credentials.accessSecret
    });
    search();

    function search(lastId) {
      var args = {
        screen_name: user.twitter.credentials.username,
        count: 200,
        include_rts: 1
      };
      // Do not include this property on the first iteration
      if(lastId) args.max_id = lastId;

      twit.getUserTimeline(args, onTimeline);

      function onTimeline(err, chunk) {
        if (err) {
          winston.error('Twitter search failed: '+ err);
          return done(err);
        }

        if (!chunk.length) {
          winston.info('User has not tweeted yet');
          return done(undefined, {});
        }

        // Get rid of the first element of each iteration (except for the first iteration)
        if (data.length) chunk.shift();

        data = data.concat(chunk);
        var thisId = parseInt(data[data.length - 1].id_str, 10);
        if (chunk.length && data.length >= 200) return search(thisId);

        // Results must be filtered ?
        if (user && user.twitter.filterIsActive === 'true') {
          data = filterTweetsFromHistory(data, user.twitter.filter);
        }
        // end the operations if there are no tweets to forward
        if (data.length === 0) return done(undefined, '[]');
        next(user, data, pryv.forwardTweetsHistory, done);
      }
    }
  });
}
module.exports.getUserTimeline = getUserTimeline;


function formatUserTimeline(user, data, next, done) {

  var len = data.length;
  var tweetsHistory = [];

  for (var i=0; i<len; i++) {
    var currentTweet = data[i];
    var tweet = {
      time: pryv.toTimestamp(currentTweet.created_at),
      tempRefId: i.toString(),
      folderId: user.pryv.folderId,
      type: {
        class: 'note',
        format: 'twitter'
      },
      value: {
        id: currentTweet.id_str,   // string ID to handle JS parsing problems
        text: currentTweet.text,
        screen_name: currentTweet.user.screen_name
      }
    };
    tweetsHistory.push(tweet);
  }
  tweetsHistory = JSON.stringify(tweetsHistory);
  next(user.pryv, tweetsHistory, done);
}
module.exports.formatUserTimeline = formatUserTimeline;

function filterTweetsFromHistory(collection, query){
    var len = collection.length;
    var newCollection = [];
    
    for(var i=0; i<len; i++){
        var item = collection[i];

        if(item.text.indexOf(query) !== -1) {
          newCollection.push(item);
        }
    }
    return newCollection;
}

function getUserData(username, done) {
  usersStorage.readUser({'pryv.credentials.username':username}, function(result){
    done(result);
  });
}
module.exports.getUserData = getUserData;