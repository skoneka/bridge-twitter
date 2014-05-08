/*global describe, it, before, after*/

var should = require('should'),
    nock = require('nock'),
    usersStorage = require('../source/storage/users-storage'),
    twitter = require('../source/lib/twitter');

describe('Twitter api', function () {
  this.timeout(10000);

  var user = {},
      data = {},
      id;

  before(function (done) {
    user = {
      'twitter': {
        'filter': '+Y',
        'filterIsActive': 'true',
        'credentials': [{
          'accessToken': '14094276-HKFyUmp59SrDq722FrWkog0J0dIrMTJFyfUU4uyhh',
          'accessSecret': '0LTUZ2Mezu2uLxU89S88hGT5gSQ783PXgov1pfdgGXptx',
          'username': 'xa4loz'
        }]
      },
      'pryv': {
        'streamId': 'social-twitter',
        'credentials': {
          'auth': 'VPoFEsuJRM',
          'username': 'perkikiki',
          isValid: true
        }
      }
    };
    usersStorage.createUser(user, function (err, result) {
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  after(function (done) {
    usersStorage.deleteUser({_id: id}, function (result) {
      result.should.have.property('ok');
      done();
    });
  });

  it('should get user\'s info', function (done) {
    twitter.getUserData('perkikiki', function () {
      should.exist(user);
      done();
    });
  });

  nock('http://api.twitter.com:443')
  .get('/1.1/statuses/user_timeline.json?screen_name=xa4loz&count=200&include_rts=1')
  .reply(200, [{'created_at':'Tue May 06 09:17:04 +0000 2014','id':463608374710792200}]);

  it('should get user\'s timeline from Twitter', function (done) {
    // twitter.getUserTimeline('perkikiki', 'xa4loz', formatUserTimeline, done);
    twitter.getUserTimeline('perkikiki', 'xa4loz', function (err, data) {
      should.exist(data);
      /*jshint -W030*/
      data.should.not.be.empty;
      done();
    });
  });

  it('should format user\'s timeline according to pryv\'s api', function (done) {
    twitter.formatUserTimeline(user, data, function (undefined, tweetsHistory) {
      should.exist(tweetsHistory);
      /*jshint -W030*/
      tweetsHistory.should.not.be.empty;
      done();
    });
  });

  it('should stream incoming tweets', function (done) {

    // TODO: implement streaming test:
    // 1)create user 2)mock new tweet event 3)verify it is forwarded to pryv

    // twitter.openedStreams['jonmaim'].updateStatus('tesssssst', function (err, data) {
    //   done();
    // });
    done();
  });
});
