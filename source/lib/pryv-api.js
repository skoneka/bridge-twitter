var https = require('https');

exports.forwardTweet = function(user, data, done) {
  if (data.created_at !== undefined) {
    var tweet = JSON.stringify({
      "time": toTimestamp(data.created_at),
      "folderId": user.folderId,
      "type": {
        "class": "note",
        "format": "twitter"
      },
      "value": {
        "id": data.id_str,   // string ID to handle JS parsing problems
        "text": data.text,
        "screen_name": data.user.screen_name
      }
    });
    console.dir(tweet);
    // the post options
    var options = {
      host : user.credentials.login + '.rec.la',
      path : '/' + user.channel_id + '/events',
      port : 443,
      method : 'POST',
      headers : {
                  'Authorization': user.credentials.auth,
                  'Content-Type' : 'application/json',
                  'Content-Length' : Buffer.byteLength(tweet, 'utf8')
      }
    };

    var reqPost = https.request(options, function(res) {
      //console.log("statusCode: ", res.statusCode);
      //console.log("headers: ", res.headers);

      res.on('data', function(d) {
        done(JSON.parse(d));
      });
    });

    // write the json data
    reqPost.write(tweet);
    reqPost.end();
    reqPost.on('error', function(e) {
      console.error(e);
    });
  }
};

exports.forwardTweetsHistory = function(user, data, done) {
  
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