var should = require('should')
var tg = require('../lib/twitter-gateway');


describe('twitterGateway', function() {
  this.timeout(5000);

  var user = {};
  var data = {};

  it('should be able to get user\'s info', function() {

    user = tg.getUserData('jcdusse4');
    should.exist(user);
  });

  it('should be able to get user\'s timeline from Twitter', function(done) {

    tg.getUserTimeline('jcdusse4', function(err, data) {
      should.exist(data);
      data.should.not.be.empty;
      done()
    });
  });

  it('should be able to format user\'s timeline according to pryv\'s api', function(done) {
    tg.formatUserTimeline(user, data, function(undefined, tweetsHistory) {
      should.exist(tweetsHistory);
      tweetsHistory.should.not.be.empty;
      done();
    });
  });
});
