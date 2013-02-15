var should = require('should'),
    nock = require('nock'),
    request = require('supertest'),
    pryv = require('../source/lib/pryv'),
    usersStorage = require('../source/storage/users-storage'),
    app = require('../source/app');


describe('forwardTweet', function(){
    this.timeout(5000);

  nock('https://jonmaim.rec.la')
    .post('/TePRIdMlgf/events {"time":1358181370,"folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976192","text":"this is a test","screen_name":"testuser"}}')
    .reply(200, {id: 'VTQkjkyIuM'}, {'Content-Type': 'application/json'});

  it('should be able to send an event to the activity server', function(done){
    var pryvUser = {
      "channelId": "TePRIdMlgf",
      "folderId": "TPZZHj5YuM",
      "credentials": {
        "username": "jonmaim",
        "auth": "VVEQmJD5T5"
      }
    },
    data = {
      'created_at': 'Mon Jan 14 16:36:10 +0000 2013',
      'id_str': '291588476627976192',
      'text': 'this is a test',
      'user': {
        'screen_name': 'testuser'
      }
    };
    pryv.forwardTweet(pryvUser, data, function(response){
      response.should.have.property('id');
      done();
    });
  })
})


// describe('forwardTweetsHistory', function(){
//   it('respond with json describing twitter\'s OAuth procedure', function(done){
//     request(app)
//       .get('/auth-process-details')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .end(function(err, res){
//         if (err) return done(err);
//         res.body.should.have.property('info');
//         res.body.url.should.equal('https://api.twitter.com/oauth/authorize');
//         done();
//     });
//   })
// })