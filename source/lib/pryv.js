// TODO: see for moving appropriate bits directly into routes

var logger = require('winston'),
    config = require('../utils/config'),
    pryv = require('pryv'),
    // TODO: replace "staging" with "domain"
    domain = config.get('pryvdomain'),
    staging = config.get('pryvStaging'),
    storage = require('../storage/users'),
    timestamp = require('unix-timestamp');

exports.targetStreamId = 'social-twitter';
exports.requestedPermissions = [
  {
    streamId: exports.targetStreamId,
    defaultName: 'Twitter',
    level: 'manage'
  }
];


/**
 * @param user
 * @param tweet
 * @param {Function} done (err, event) Returns the Pryv event created if forwarded
 */
exports.forwardTweet = function (user, tweet, done) {
  var eventData = {
    time: timestamp.fromDate(tweet.created_at),
    streamId: user.pryv.streamId,
    type: 'message/twitter'
  };
  if (tweet.event === 'favorite') {
    eventData.content = {
      id: tweet.target.id_str,
      'screen-name': tweet.target.screen_name,
      text: tweet.target_object.text
    };
    return sendTweetEvent(user, eventData, done);
  } else if (tweet.created_at &&
             ! tweet.hasOwnProperty('event') &&
             user.twitter.filterOption !== 'favorite') {
    if ((user.twitter.filterOption === 'filter' &&
         tweet.text.indexOf(user.twitter.filter) !== -1) ||
        user.twitter.filterOption === 'all') {
      eventData.content = {
        id: tweet.id_str,
        'screen-name': tweet.user.screen_name,
        text: tweet.text
      };
      return sendTweetEvent(user, eventData, done);
    }
  }
  // no need to forward
  done(null, null);
};

function sendTweetEvent(user, eventData, done) {
  // TODO: update this call to new args format
  var connection = new pryv.Connection({
    username: user.pryv.credentials.username,
    auth: user.pryv.credentials.auth,
    staging: staging
  });

  connection.events.create(eventData, function (err, event) {
    if (err && err.id === 'invalid-access-token') {
      var condition = {'pryv.credentials.username': user.pryv.credentials.username};
      var update = {'pryv': {'credentials': {
        'auth': user.pryv.credentials.auth,
        'username': user.pryv.credentials.username,
        'isValid' : false
      }}};
      storage.updateUser(condition, update, function (err) {
        if (err) {
          logger.warn(err);
        } else {
          logger.info('auth not valid, user info updated!');
        }
      });
    }
    done(err, event || null);
  });
}

exports.forwardTweetsHistory = function (user, data, done) {
  removeDuplicateEvents(user, data, sendFilteredData, done);
};

exports.sendFilteredData = sendFilteredData;
function sendFilteredData(user, eventsData, done) {
  var settings = {
    username: user.credentials.username,
    auth: user.credentials.auth,
    staging: staging
  };

  // TODO: update this call to new args format
  var connection = new pryv.Connection(settings);
  connection.events.batchWithData(eventsData, function (err, events) {
    if (err) { logger.error(err); }
    logger.info(events.length + ' event(s) successfully created on pryv');
    done(err, {eventsForwarded: events.length} || {eventsForwarded: 0});
  });
}

exports.removeDuplicateEvents = removeDuplicateEvents;
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
    streams:    [exports.targetStreamId]
  };
  connection.events.get(params, function (err, events) {
    if (err) {
      logger.error('failed to fetch data: ' + err);
      return done(null);
    }
    logger.info('comparing ' + events.length +
      ' events with ' + dataArray.length +
      ' events to be sent');

    for (var i = 0; i < events.length; i++) {
      for (var j = dataArray.length - 1; j >= 0; j--) {
        if (areSameEvent(dataArray[j], events[i])) {
          dataArray.splice(j, 1);
        }
      }
    }
    next(user, dataArray, done);
  });
}

function areSameEvent(eventDataA, eventDataB) {
  return eventDataA && eventDataB &&
      eventDataA.time === eventDataB.time &&
      eventDataA.type === eventDataB.type;
}
