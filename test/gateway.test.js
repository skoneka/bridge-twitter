var should = require('should'),
    nock = require('nock'),
    request = require('supertest'),
    gateway = require('../source/lib/gateway'),
    usersStorage = require('../source/storage/users-storage'),
    app = require('../source/app'),
    JSV = require('JSV').JSV,
    util = require('util'),

    userSettingsData = {
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
            'filterIsActive': 'true',
            'credentials': {
              'accessToken': 'atk-string',
              'accessSecret': 'ats-string',
              'username':'twitter_user'
            }
          }
        }
      };


describe('GET /auth-process-details', function(){
  it('should respond with json describing twitter\'s OAuth procedure', function(done){
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
  it('should provide a valid schema of a user description', function(done){
    request(app)
      .get('/user-settings-schema')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        var env = JSV.createEnvironment();
        var report = env.validate(userSettingsData.user, res.body);
        if (report.errors.length === 0) return done();
    });
  })
})

describe('POST /user-settings', function(){
  var id;
  it('should insert new user settings in DB', function(done){
    request(app)
      .post('/user-settings')
      .send(userSettingsData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(err, res){
        if (err) return done(err);
        res.body.should.have.property('ok');
        id = res.body.ok;
        usersStorage.readUser({'_id':id}, function(result){
          if (result) done();
        });
    });
  })
  it('should detect wrong JSON when POSTing /user-settings', function(done){
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
            'filterIsActive': 'true',
            'accessToken': 'atk-string',
            'accessSecret': 'ats-string',
            'username':'twitter_user'
          }
        } 
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err, res){
        if (err) return done(err);
        res.body.should.have.property('id');
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
        "filterIsActive": 'true',
        "credentials": {
          "accessToken": "atk-string",
          "accessSecret": "ats-string",
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
    usersStorage.createUser(user, function(err, result){
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('should return info about user', function(done){
    request(app)
      .get('/user-settings/pryv-username')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        res.body.pryv.credentials.username.should.equal('pryv-username');
        done();
    });
  });

  it('should return 404 when asked about a non existent user', function(done){
    request(app)
      .get('/user-settings/testuser2')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)
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
        "filterIsActive": 'true',
        "credentials": {
          "accessToken": "atk-string",
          "accessSecret": "ats-string",
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
    usersStorage.createUser(user, function(err, result){
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('should update user info', function(done){
    request(app)
      .put('/user-settings/pryv-username')
      .set('Accept', 'application/json')
      .send({
        'twitter': {
          'filter': 'new filter',
          'filterIsActive': 'true'
        },
        'pryv': {
          'folderId': 'new folderId'
        }
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        done();
    });
  });

  it('should find updated info in db', function(done){
    usersStorage.readUser({'_id':id}, function(result){
      if (result) {
        result.twitter.filter.should.equal('new filter');
        done();
      }
    });
  });

  it('should detect wrong JSON when updating', function(done){
    request(app)
      .put('/user-settings/pryv-username')
      .set('Accept', 'application/json')
      .send({
        'truc': {
          'filter': 'new filter'
        }
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err, res){
        if (err) return done(err);
        res.body.should.have.property('id');
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