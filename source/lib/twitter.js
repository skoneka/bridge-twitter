
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

  for (var i=0; i<user.twitter.credentials.length; i++) {
    if (user.twitter.credentials[i].accessToken === '') continue;
    var currentTwitterUsername = user.twitter.credentials[i].username;

    //if the stream was already opened, kill it and remove its reference
    if (typeof openedStreams[currentTwitterUsername] !== 'undefined') {
      console.dir(openedStreams[currentTwitterUsername]);
      openedStreams[currentTwitterUsername].streamRef.destroy();
      delete openedStreams[currentTwitterUsername];
    }

    openedStreams[currentTwitterUsername] = new twitter({
      consumer_key: config.get('twitter:consumerKey'),
      consumer_secret: config.get('twitter:consumerSecret'),
      access_token_key: user.twitter.credentials[i].accessToken,
      access_token_secret: user.twitter.credentials[i].accessSecret
    });
    openedStreams[currentTwitterUsername].stream('user', {track:user.twitter.credentials[i].username}, function(stream) {
      openedStreams[currentTwitterUsername].streamRef = stream;
      stream.on('data', function (data) {
        pryv.forwardTweet(user, data, function(response) {
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
}
module.exports.streamUserTweets = streamUserTweets;

exports.transferUserTimeline = function(username, account, done) {

  getUserTimeline(username, account, formatUserTimeline, done);
};

function getUserTimeline(username, account, next, done) {

  var data = [];
  var user = getUserData(username.toLowerCase(), function(user){
    if (!user) return done('user not found', data);
    console.dir(user.twitter.credentials);
    var credentials = {};
    for (var i=0; i<user.twitter.credentials.length; i++) {
      var currentCredentials = user.twitter.credentials[i];
      console.log("matching "+currentCredentials.username+" with "+account);
      if (currentCredentials.accessToken === '') continue;
      if (currentCredentials.username.toLowerCase() === account.toLowerCase()) {
        credentials = currentCredentials;
        console.log("ok");
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
      if(lastId) args.max_id = lastId;

      twit.getUserTimeline(args, onTimeline);

      function onTimeline(err, chunk) {
        if (err) {
          winston.error('Twitter search failed: '+ err);
          return done(err);
        }

        if (!chunk.length) {
          //User has not tweeted yet
          return done(undefined, '[]');
        }

        // Get rid of the first element of each iteration (except for the first iteration)
        if (data.length) chunk.shift();

        data = data.concat(chunk);
        var thisId = parseInt(data[data.length - 1].id_str, 10);
        if (chunk.length && data.length >= 200) return search(thisId);

        console.dir(data);

        // Results must be filtered ?
        if (user && user.twitter.filterOption === 'filter') {
          data = filterTweetsFromHistory(data, user.twitter.filter);
        }

        // Only import favorited tweets ?
        if (user && user.twitter.filterOption === 'favorite') {
          data = selectFavsFromHistory(data);
        }

        // end the operations if there are no tweets left to forward
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
        class: 'message',
        format: 'twitter'
      },
      value: currentTweet
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

function selectFavsFromHistory(collection, query){
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