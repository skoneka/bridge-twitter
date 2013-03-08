var https = require('https');
var request = require('superagent');

exports.forwardTweet = function(user, data, done) {
    if (data.event === 'favorite') {
      var tweet = {
        time: toTimestamp(data.created_at),
        folderId: user.folderId,
        type: {
          class: 'note',
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
          class: 'note',
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
      .on('error', function(err) {console.log('connection error');})
      .end(function(res){
        if (res.ok) {
          done(res.body);
        } else {
          //console.log('error: ' + res.text);
          //done('error: ' + res.text);
        }
      });
};

exports.forwardTweetsHistory = function(user, data, done) {
  request
    .post('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events/batch')
    .set('Authorization', user.credentials.auth)
    .send(JSON.parse(data))
    .on('error', function(err) {console.log(err);})
    .end(function(res){
      if (res.ok) {
        done(undefined, res.body);
      } else {
        //console.log('error: ' + res.text);
        done(undefined, res.body);
      }
    });
};

function toTimestamp(strDate){
 var date = Date.parse(strDate);
 return date/1000;
}
module.exports.toTimestamp = toTimestamp;