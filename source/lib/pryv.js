var request = require('superagent'),
    winston = require('winston'),
    config = require('../utils/config'),
    Pryv = require('pryv'),
    domain = config.get('pryvdomain'),
    staging = config.get('pryvStaging');

exports.forwardTweet = function (user, data, done) {
  console.log('DATA:');
  console.dir(data);
  var tweet = {};
  if (data.event === 'favorite') {
    tweet = {
      time: toTimestamp(data.created_at),
      streamId: user.pryv.streamId,
      type: 'message/twitter',
      content: {
        id: data.target.id_str,
        'screen-name': data.target.screen_name,
        text: data.target_object.text
      }
    };
    sendTweet(user, tweet, done);
  } else if (data.created_at !== undefined &&
      ! data.hasOwnProperty('event') &&
      user.twitter.filterOption !== 'favorite') {
    if ((user.twitter.filterOption === 'filter' &&
      data.text.indexOf(user.twitter.filter) !== -1) ||
      user.twitter.filterOption === 'all') {
      tweet = {
        time: toTimestamp(data.created_at),
        streamId: user.pryv.streamId,
        type: 'message/twitter',
        content: {
          id: data.id_str,
          'screen-name': data.user.screen_name,
          text: data.text
        }
      };
    }
    sendTweet(user, tweet, done);
  }
};

function sendTweet(user, tweet, done) {
  var connection = new Pryv.Connection({
    username: user.pryv.credentials.username,
    auth: user.pryv.credentials.auth,
    staging: staging
  });
  var eventData = {
    streamId : user.pryv.streamId,
    time: tweet.time,
    type: 'message/twitter',
    content: tweet.content
  };
  connection.events.create(eventData, function (err, event) {
    console.log('Event created:');
    console.dir(event);
    done();
//    connection.events.get({limit : 3}, function (err, events) {
//      console.dir(events);
//    });
  });
}
module.exports.sendTweet = sendTweet;

exports.forwardTweetsHistory = function (user, data, done) {
  removeDuplicateEvents(user, data, sendFilteredData, done);
};


function sendFilteredData(user, data, done) {
  request
  .post('https://' + user.credentials.username + '.' +
    domain + ':443/events/batch')
  .set('Authorization', user.credentials.auth)
  .send(data)
  .on('error', function (err) { winston.error(err); })
  .end(function (res) {
    if (res.ok) {
      done(undefined, res.body);
    }
  });
}
module.exports.sendFilteredData = sendFilteredData;


function toTimestamp(strDate) {
  var date = Date.parse(strDate);
  return date / 1000;
}
module.exports.toTimestamp = toTimestamp;


function removeDuplicateEvents(user, data, next, done) {
  var dataArray = JSON.parse(data);
  request
    .get('https://' + user.credentials.username + '.' + domain + ':443/events?fromTime=' +
          dataArray[dataArray.length - 1].time + '&toTime=' + (dataArray[0].time + 1))
    .set('Authorization', user.credentials.auth)
    .on('error', function (err) { winston.error(err); })
    .end(function (res) {
      if (res.ok) {
        for (var i = 0; i < res.body.length; i++) {
          for (var j = 0, arrlen = dataArray.length; j < arrlen; j++) {
            if (typeof dataArray[j] !== 'undefined' && res.body[i].time === dataArray[j].time) {
              dataArray = dataArray.slice(0, j).concat(dataArray.slice(j + 1, arrlen));
            }
          }
        }
        next(user, dataArray, done);
      }
    });
}
module.exports.removeDuplicateEvents = removeDuplicateEvents;
