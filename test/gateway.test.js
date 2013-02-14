var should = require('should'),
    nock = require('nock'),
    request = require('supertest'),
    gateway = require('../source/lib/gateway'),
    usersStorage = require('../source/storage/users-storage'),
    app = require('../source/app');


describe('GET /auth-process-details', function(){
  it('respond with json describing twitter\'s OAuth procedure', function(done){
    request(app)
      .get('/auth-process-details')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.should.have.property('info');
        res.body.url.should.equal('https://api.twitter.com/oauth/authorize');
        done();
    });
  })
})

describe('GET /user-settings-schema', function(){
  it('provide schema of a user description', function(done){
    request(app)
      .get('/user-settings-schema')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        //res.body.should.have.property('pryv');
        done();
    });
  })
})

describe('POST /user-settings', function(){
  var id;
  it('insert new user in DB', function(done){
    request(app)
      .post('/user-settings')
      .send({
        'user': {
          'pryv': {
            'credentials': {
              'username':'pryv_user',
              'auth':'auth_string'
            },
            'channelId':'TePRIdMlgf',
            'folderId':'TPZZHj5YuM'
          },
          'twitter': {
            'filter': '+Y',
            'filterIsActive': true,
            'credentials': {
              'consumer_key': 'ck_string',
              'consumer_secret':'cs_string',
              'access_token_key':'atk_string',
              'access_token_secret':'ats_string',
              'username':'twitter_user'
            }
          }
        }
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.should.have.property('ok');
        id = res.body.ok;
        done();
    });
  })
  after(function(done){
    usersStorage.deleteUser({_id:id}, function(message){
      message.should.have.property('ok');
      done();
    });
  });
})

describe('GET /user-settings/user', function(){ 
  var id;
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
          "username": "twitter-username"
        }
      },
      "pryv": {
        "channelId": "TePRIdMlgf",
        "folderId": "TPZZHj5YuM",
        "credentials": {
          "auth": "auth-string",
          "username": "pryv-username"
        }
      }
    };
    usersStorage.createUser(user, function(result){
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('return info about user', function(done){
    request(app)
      .get('/user-settings/jonmaim')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.pryv.credentials.username.should.equal('jonmaim');
        done();
    });
  });

  it('return info about non existent user', function(done){
    request(app)
      .get('/user-settings/testuser2')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.error.should.equal('no such user');
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

describe('PUT /user-settings/user', function(){ 
  var id;
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
          "username": "twitter-username"
        }
      },
      "pryv": {
        "channelId": "TePRIdMlgf",
        "folderId": "TPZZHj5YuM",
        "credentials": {
          "auth": "auth-string",
          "username": "pryv-username"
        }
      }
    };
    usersStorage.createUser(user, function(result){
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('update user info', function(done){
    request(app)
      .put('/user-settings/pryv-username')
      .set('Accept', 'application/json')
      .send({
        'twitter': {
          'filter': '+Z'
        }
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.numAffected.should.equal(1);
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

  // it('provide info about user', function(done) {

  // });

  // it('update user info', function(done) {

  // });

  // it('provide schema of a user description', function(done) {

  // });

  // it('get the user\'s timeline and forward it to pryv', function(done) {

  // });
