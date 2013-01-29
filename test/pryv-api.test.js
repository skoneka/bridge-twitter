var should = require('should')
var pryv = require('../source/lib/pryv-api');


describe('pryvApi', function() {
  this.timeout(5000);

  it('should be able to send a batch of status updates to pryv', function(done) {

    var testData = JSON.stringify([{
      "time":1358181370,
      "tempRefId":"0",
      "type":{
        "class":"note",
        "format":"twitter"
      },
      "value":{
        "id":"290859864039751680",
        "text":"this is a 'status' update..",
        "screen_name":"JCDusse4"
      }
    }]);

    var user = { channelId: 'PVwkDEbXXM',
         folderId: 'TTaEnE7GGM',
         credentials: { username: 'perkikiki', auth: 'Ve69mGqqX5' } };

    pryv.forwardTweetsHistory(user, testData, function(err, data) {
      data.should.be.a('object').and.have.property('0');
      done()
    });
  });



/*
  it('should be able to retrieve specific users\' tweets', function(done) {

    tg.searchUserTweets('xa4loz', '+Y', function(err, data) {
      should.exist(data);
      data.results.should.not.be.empty;
      done()
	  });
  });
  */
});
