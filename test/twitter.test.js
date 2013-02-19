var should = require('should'),
    nock = require('nock'),
    usersStorage = require('../source/storage/users-storage'),
    twitter = require('../source/lib/twitter');


describe('twitter gateway', function() {
  this.timeout(5000);

  var user = {},
      data = {},
      id;

  before(function(done){
    var user = {
      "twitter": {
        "filter": "+Y",
        "filterIsActive": true,
        "credentials": {
          "access_token_key": "atk-string",
          "access_token_secret": "ats-string",
          "consumer_key": "ck-string",
          "consumer_secret": "cs-string",
          "username": "twitter-user"
        }
      },
      "pryv": {
        "channelId": "TePRIdMlgf",
        "folderId": "TPZZHj5YuM",
        "credentials": {
          "auth": "auth-string",
          "username": "pryv-user"
        }
      }
    };
    usersStorage.createUser(user, function(result){
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('should get user\'s info', function(done) {

    twitter.getUserData('pryv-user', function(result){
      should.exist(user);
      done();
    });
  });

  it('should get user\'s timeline from Twitter', function(done) {

    nock('https://api.twitter.com')
      .get('/1.1/statuses/user_timeline.json?screen_name=twitter-user&count=200&include_rts=1')
      .reply(200, 
        [{ created_at: 'Mon Jan 14 14:36:57 +0000 2013',
        id: 290829865081516000,
        id_str: '290829865081516032',
        text: 'this is a status update +Y',
        user: 
         { id: 1079604163,
           id_str: '1079604163',
           name: 'JC Dusse',
           screen_name: 'JCDusse4'
         }
        }]);

    twitter.getUserTimeline('pryv-user', function(err, data) {
      should.exist(data);
      data.should.not.be.empty;
      done()
    });
  });

  it('should format user\'s timeline according to pryv\'s api', function(done) {
    twitter.formatUserTimeline(user, data, function(undefined, tweetsHistory) {
      should.exist(tweetsHistory);
      tweetsHistory.should.not.be.empty;
      done();
    });
  });
  
  after(function(done){
    usersStorage.deleteUser({_id:id}, function(result){
      result.should.have.property('ok');
      done();
    });
  });
});
