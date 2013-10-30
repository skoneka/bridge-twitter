var request = require('superagent'),
    winston = require('winston'),
    config = require('../utils/config'),
    domain = config.get('pryvdomain');

exports.forwardTweet = function(user, data, done) {
    var tweet = {};
    if (data.event === 'favorite') {
      tweet = {
        time: toTimestamp(data.created_at),
        streamId: 'social-twitter',
        type: 'message/twitter',
        content: {
          id: data.id_str,
          'screen-name': data.user.screen_name,
          text: data.text
        }
      };
    } else if (data.created_at !== undefined &&
        !data.hasOwnProperty('event') &&
        user.twitter.filterOption !== 'favorite') {
      if ((user.twitter.filterOption === 'filter' &&
        data.text.indexOf(user.twitter.filter) !== -1) ||
        user.twitter.filterOption === 'all') {
        tweet = {
          time: toTimestamp(data.created_at),
          streamId: 'social-twitter',
          type: 'message/twitter',
          content: {
            id: data.id_str,
            'screen-name': data.user.screen_name,
            text: data.text
          }
        };
      }
    }
    request
      .post('https://' + user.pryv.credentials.username +
        '.' + domain + ':443/events')
      .set('Authorization', user.pryv.credentials.auth)
      .send(tweet)
      .on('error', function(err) {winston.error('connection error: ' + err);})
      .end(function(res){
        if (res.ok) {
          done(res.body);
        }
      });
};


exports.forwardTweetsHistory = function(user, data, done) {
  removeDuplicateEvents(user, data, sendFilteredData, done);
};


function sendFilteredData(user, data, done){
  request
  .post('https://' + user.credentials.username + '.' +
    domain + ':443/events/batch')
  .set('Authorization', user.credentials.auth)
  .send(data)
  .on('error', function(err) {winston.error(err);})
  .end(function(res){
    if (res.ok) {
      done(undefined, res.body);
    }
  });
}
module.exports.sendFilteredData = sendFilteredData;


function toTimestamp(strDate){
  var date = Date.parse(strDate);
  return date/1000;
}
module.exports.toTimestamp = toTimestamp;


function removeDuplicateEvents(user, data, next, done){

  var dataArray = JSON.parse(data);
  request
    .get('https://' + user.credentials.username + '.' + domain + ':443/events?fromTime='
      + dataArray[dataArray.length-1].time + '&toTime=' + (dataArray[0].time+1))
    .set('Authorization', user.credentials.auth)
    .on('error', function(err) {winston.error(err);})
    .end(function(res){
      if (res.ok) {
        for (var i = 0; i<res.body.length; i++) {
          var arrlen = dataArray.length;
          for (var j = 0; j<arrlen; j++) {
            if (typeof dataArray[j] !== 'undefined' && res.body[i].time === dataArray[j].time) {
              dataArray = dataArray.slice(0, j).concat(dataArray.slice(j+1, arrlen));
            }
          }
        }
        next(user, dataArray, done);
      }
    });
}
module.exports.removeDuplicateEvents = removeDuplicateEvents;
