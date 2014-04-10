var request = require('superagent'),
    winston = require('winston'),
    config = require('../utils/config'),
    pryv = require('pryv'),
    domain = config.get('pryvdomain'),
    staging = config.get('pryvStaging'),
    usersStorage = require('../storage/users-storage'),
    timestamp = require('unix-timestamp');

/**
 * @param user
 * @param data
 * @param {Function} done (err, event) Returns the Pryv event created if forwarded
 */
exports.forwardTweet = function (user, data, done) {
  var tweet = {
    time: timestamp.fromDate(data.created_at),
    streamId: user.pryv.streamId,
    type: 'message/twitter'
  };
  if (data.event === 'favorite') {
    tweet.content = {
      id: data.target.id_str,
      'screen-name': data.target.screen_name,
      text: data.target_object.text
    };
    return sendTweet(user, tweet, done);
  } else if (data.created_at &&
             ! data.hasOwnProperty('event') &&
             user.twitter.filterOption !== 'favorite') {
    if ((user.twitter.filterOption === 'filter' &&
         data.text.indexOf(user.twitter.filter) !== -1) ||
        user.twitter.filterOption === 'all') {
      tweet.content = {
        id: data.id_str,
        'screen-name': data.user.screen_name,
        text: data.text
      };
      return sendTweet(user, tweet, done);
    }
  }
  // no need to forward
  done(null, null);
};

function sendTweet(user, tweet, done) {
  var connection = new pryv.Connection({
    username: user.pryv.credentials.username,
    auth: user.pryv.credentials.auth,
    staging: staging
  });

  connection.events.create(tweet, function (err, event) {
    if (err && err.id === 'invalid-access-token') {
      var condition = {'pryv.credentials.username': user.pryv.credentials.username};
      var update = {'pryv': {'credentials': {
        'auth': user.pryv.credentials.auth,
        'username': user.pryv.credentials.username,
        'isValid' : false
      }}};
      usersStorage.updateUser(condition, update, function (err) {
        if (err) {
          winston.warn(err);
        } else {
          winston.info('auth not valid, user info updated!');
        }
      });
    }
    done(err, event || null);
  });
}
module.exports.sendTweet = sendTweet;

exports.forwardTweetsHistory = function (user, data, done) {
  removeDuplicateEvents(user, data, sendFilteredData, done);
};


function sendFilteredData(user, remainingStuff, done) {
  var settings = {
    username: user.credentials.username,
    auth: user.credentials.auth,
    staging: staging
  };
  var connection = new pryv.Connection(settings);

  connection.events.batchWithData(remainingStuff, function (err, events) {
    if (err) { winston.error(err); }
    winston.info(events.length + ' event(s) successfully created on pryv');
    done(err, {eventsForwarded: events.length} || {eventsForwarded: 0});
  });



}
module.exports.sendFilteredData = sendFilteredData;

function removeDuplicateEvents(user, data, next, done) {
  var dataArray = JSON.parse(data);
  var settings = {
    username: user.credentials.username,
    auth: user.credentials.auth,
    staging: staging
  };
  var connection = new pryv.Connection(settings);
  var params = {
    fromTime:   dataArray[dataArray.length - 1].time,
    toTime:     dataArray[0].time + 1,
    streams:    ['social-twitter'] 
  };
  connection.events.get(params, function (err, events) {
    if (err) {
      winston.error('failed to fetch data: ' + err);
      return done(null);
    }
    winston.info('comparing ' + events.length +
      ' events with ' + dataArray.length +
      ' events to be sent');

    for (var i = 0; i < events.length; i++) {
      var arrlen = dataArray.length;
      for (var j = 0; j < arrlen; j++) {
        if (typeof dataArray[j] !== 'undefined' && events[i].time === dataArray[j].time) {
          dataArray = dataArray.slice(0, j).concat(dataArray.slice(j + 1, arrlen));
        }
      }
    }
    next(user, dataArray, done);
  });

}
module.exports.removeDuplicateEvents = removeDuplicateEvents;
