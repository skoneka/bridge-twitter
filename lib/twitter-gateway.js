
var twitter = require('ntwitter');
var users = require('./twitter-users.json');
var pryv = require('./pryv-api');



exports.streamUserTweets = function() {
  var len = users.length;

  for (var i=0; i<len; i++ ) {
    var currentUser = users[i];
    var twit = new twitter({
      consumer_key: currentUser.twitter.credentials.consumer_key,
      consumer_secret: currentUser.twitter.credentials.consumer_secret,
      access_token_key: currentUser.twitter.credentials.access_token_key,
      access_token_secret: currentUser.twitter.credentials.access_token_secret
    });

    twit.stream('user', currentUser.pryv, {track:currentUser.twitter.screen_name}, function(stream, pryvUserData) {
      stream.on('data', function (data) {
        pryv.forwardTweet(pryvUserData, data, function(response) {
          console.log("Tweet successfully stored on Pryv with id " + response.id);
        });
      });
      stream.on('end', function (response) {
        // Handle a disconnection
      });
      stream.on('destroy', function (response) {
        // Handle a 'silent' disconnection from Twitter, no end/error event fired
      });
      stream.on('error', function(error, code) {
        console.log("Error: " + error + ": " + code);
      });
    });
  }
};

exports.transferUserTimeline = function(username, done) {

  getUserTimeline(username, formatUserTimeline, done);
};

function getUserTimeline(username, next, done) {

  var data = [];
  var user = getUserData(username.toLowerCase());
  if (!user) return done('user not found', data);
  var twit = new twitter({
      consumer_key: user.twitter.credentials.consumer_key,
      consumer_secret: user.twitter.credentials.consumer_secret,
      access_token_key: user.twitter.credentials.access_token_key,
      access_token_secret: user.twitter.credentials.access_token_secret
  });

  search();

  function search(lastId) {
    var args = {
      screen_name: username,
      count: 200,
      include_rts: 1
    };
    // Do not include this property on the first iteration
    if(lastId) args.max_id = lastId;

    twit.getUserTimeline(args, onTimeline);

    function onTimeline(err, chunk) {
      if (err) {
        console.log('Twitter search failed!');
        return done(err);
      }

      if (!chunk.length) {
        console.log('User has not tweeted yet');
        return done(err);
      }

      // Get rid of the first element of each iteration (except the first)
      if (data.length) chunk.shift();

      data = data.concat(chunk);
      var thisId = parseInt(data[data.length - 1].id_str, 10);
      if (chunk.length) return search(thisId);

      // Results must be filtered ?
      if (user && user.twitter.config.filterIsActive) {
        data = filterTweetsFromHistory(data, user.twitter.config.filter);
      } 
      next(user, data, pryv.forwardTweetsHistory, done);
    }
  }
}
module.exports.getUserTimeline = getUserTimeline;


function formatUserTimeline(user, data, next, done) {

  var len = data.length;
  var tweetsHistory = [];

  for (var i=0; i<len; i++) {
    var currentTweet = data[i];
    var tweet = {
      "time": pryv.toTimestamp(currentTweet.created_at),
      "tempRefId": i.toString(),
      "folderId": user.folder_id,
      "type": {
        "class": "note",
        "format": "twitter"
      },
      "value": {
        "id": currentTweet.id_str,   // string ID to handle JS parsing problems
        "text": currentTweet.text,
        "screen_name": currentTweet.user.screen_name
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

function getUserData(usr) {
  var len = users.length;
  var userData = {};

  for(var i=0; i<len; i++){
    var currentUser = users[i];

      if(currentUser.twitter.screen_name === usr) {
        return currentUser;
      }
  }
  return false;
}
module.exports.getUserData = getUserData;