var https = require('https');
    request = require('superagent'),
    winston = require('winston');

exports.forwardTweet = function(user, data, done) {
    if (data.event === 'favorite') {
      var tweet = {
        time: toTimestamp(data.created_at),
        folderId: user.folderId,
        type: {
          class: 'message',
          format: 'twitter'
        },
        value: {
          id: data.target_object.id_str,   // string ID to handle JS parsing problems
          text: data.target_object.text,
          screen_name: data.target_object.user.screen_name
        }
      };
    } else if (data.created_at !== undefined && !data.hasOwnProperty('event')) {
      var tweet = {
        time: toTimestamp(data.created_at),
        folderId: user.folderId,
        type: {
          class: 'message',
          format: 'twitter'
        },
        value: {
          id: data.id_str,   // string ID to handle JS parsing problems
          text: data.text,
          screen_name: data.user.screen_name
        }
      };
    }
    request
      .post('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events')
      .set('Authorization', user.credentials.auth)
      .send(tweet)
      .on('error', function(err) {winston.error('connection error');})
      .end(function(res){
        if (res.ok) {
          done(res.body);
        }
      });
};

exports.forwardTweetsHistory = function(user, data, done) {
  removeDuplicateEvents(user, data, function(data){
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
  });
};

function toTimestamp(strDate){
 var date = Date.parse(strDate);
 return date/1000;
}
module.exports.toTimestamp = toTimestamp;

function removeDuplicateEvents(user, data, done){
  dataArray = JSON.parse(data);
  request
    // .get('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events?limit=1')
    .get('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events?fromTime=' + dataArray[dataArray.length-1].time + '&toTime=' + (dataArray[0].time+1))
    .set('Authorization', user.credentials.auth)
    .on('error', function(err) {winston.error(err);})
    .end(function(res){
      if (res.ok) {
        console.log('got ' + res.body.length + ' events from ' + dataArray[dataArray.length-1].time + ' to ' + (dataArray[0].time+1));
        console.dir(dataArray);
        console.dir(res.body);
        for (var i = 0; i<res.body.length; i++) {
          var arrlen = dataArray.length;
          for (var j = 0; j<arrlen; j++) {
            if (typeof dataArray[j]!=='undefined' && res.body[i].time === dataArray[j].time) {
              dataArray = dataArray.slice(0, j).concat(dataArray.slice(j+1, arrlen));
              console.log("object removed with time " + res.body[i].time);
            }
          }
        }
        done(dataArray);
      }
    });
}
module.exports.removeDuplicateEvents = removeDuplicateEvents;
