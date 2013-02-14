var https = require('https');
var request = require('superagent');

exports.forwardTweet = function(user, data, done) {
  if (data.created_at !== undefined) {
    //var tweet = JSON.stringify({
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

    request
      .post('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events')
      .set('Authorization', user.credentials.auth)
      .send(tweet)
      .on('error', function(err) {console.log(err);})
      .end(function(res){
        if (res.ok) {
          done(res.body);
        } else {
          console.log('error: ' + res.text);
        }
      });
  }
};

exports.forwardTweetsHistory = function(user, data, done) {
  /*
   * Equivalent request using superagent
   */
  // request
  //   .post('https://' + user.credentials.username + '.rec.la:443/' + user.channelId + '/events/batch')
  //   .set('Authorization', user.credentials.auth)
  //   .send(JSON.parse(data))
  //   .on('error', function(err) {console.log(err);})
  //   .end(function(res){
  //     if (res.ok) {
  //       done(undefined, res.body);
  //     } else {
  //       console.log('error: ' + res.text);
  //     }
  //   });

  /*
   * Equivalent request but without using superagent
   */
  var options = {
    host : user.credentials.username + '.rec.la',
    path : '/' + user.channelId + '/events/batch',
    port : 443,
    method : 'POST',
    headers : {
                'Authorization': user.credentials.auth,
                'Content-Type' : 'application/json',
                'Content-Length' : Buffer.byteLength(data, 'utf8')
    }
  };

  var reqPost = https.request(options, function(res) {
    res.on('data', function(d) {
      done(undefined, JSON.parse(d));
    });
  });

  // write the json data
  reqPost.write(data);
  reqPost.end();
  reqPost.on('error', function(e) {
    console.error(e);
  });

};

function toTimestamp(strDate){
 var date = Date.parse(strDate);
 return date/1000;
}
module.exports.toTimestamp = toTimestamp;