var https = require('https');
    request = require('superagent'),
    winston = require('winston'),
     config = require('../utils/config');

var domain = config.get('pryvdomain');

exports.forwardTweet = function(user, data, done) {
    if (data.event === 'favorite') {
      var tweet = {
        time: toTimestamp(data.created_at),
        folderId: user.pryv.folderId,
        type: {
          class: 'message',
          format: 'twitter'
        },
        value: data.target_object
      };
    } else if (data.created_at !== undefined && !data.hasOwnProperty('event') && user.twitter.filterOption !== 'favorite') {
      if ((user.twitter.filterOption === 'filter' && data.text.indexOf(user.twitter.filter) !== -1) || user.twitter.filterOption === 'all')
      var tweet = {
        time: toTimestamp(data.created_at),
        folderId: user.pryv.folderId,
        type: {
          class: 'message',
          format: 'twitter'
        },
        value: data
      };
    }
    request
      .post('https://' + user.pryv.credentials.username + '.rec.la:443/' + user.pryv.channelId + '/events')
      .set('Authorization', user.pryv.credentials.auth)
      .send(tweet)
      .on('error', function(err) {winston.error('connection error');})
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
  .post('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events/batch')
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
    // .get('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events?limit=1')
    .get('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events?fromTime=' + dataArray[dataArray.length-1].time + '&toTime=' + (dataArray[0].time+1))
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
