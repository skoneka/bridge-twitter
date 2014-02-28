/*global describe, it, before, after*/

var should = require('should'),
    nock = require('nock'),
    request = require('supertest'),
    gateway = require('../source/lib/gateway'),
    usersStorage = require('../source/storage/users-storage'),
    app = require('../source/app'),
    JSV = require('JSV').JSV;

var userSettingsData = {
  user: {
    pryv: {
      credentials: {
        username: 'pryv_user',
        auth: 'auth_string'
      },
      streamId: 'social-twitter'
    },
    twitter: {
      filter: '+Y',
      filterOption: '',
      credentials: [{
        accessToken: '',
        accessSecret: '',
        username: ''
      }]
    }
  }
};


describe('gateway', function () {

  var id;
  before(function (done) {
    usersStorage.createUser(userSettingsData.user, function (err, result) {
      result.should.have.property('ok');
      id = result.ok;
      done();
    });
  });

  it('should respond with json describing twitter\'s OAuth procedure', function (done) {
    request(app)
        .get('/auth-process-details')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.should.have.property('info');
      res.body.url.should.equal('https://api.twitter.com/oauth/authorize');
      done();
    });
  });

  it('should provide a valid schema of a user description', function (done) {
    request(app)
        .get('/user-settings-schema')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
      if (err) { return done(err); }
      var env = JSV.createEnvironment();
      var report = env.validate(userSettingsData.user, res.body);
      if (report.errors.length === 0) {
        return done();
      } else {
        console.dir(report.errors);
      }
    });
  });

  it('should insert new user settings in DB', function (done) {
    request(app)
        .post('/user-settings')
        .send(userSettingsData)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.should.have.property('ok');
      id = res.body.ok;
      usersStorage.readUser({'_id': id}, function (result) {
        if (result) { done(); }
      });
    });
  });

  it('should detect wrong JSON when POSTing /user-settings', function (done) {
    var data = {
      'user': {
        'praive': {
          'credentials': {
            'username': 'pryv_user',
            'auth': 'auth_string'
          },
          'streamId': 'TePRIdMlgf'
        },
        'twitter': {
          'filter': '+Y',
          'filterOption': '',
          'credentials': [{
            'accessToken': 'atk-string',
            'accessSecret': 'ats-string',
            'username': 'twitter_user'
          }]
        }
      }
    };
    request(app)
        .post('/user-settings')
        .send(data)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.should.have.property('id');
      done();
    });
  });

  it('should return info about user', function (done) {
    request(app)
        .get('/user-settings/pryv_user')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.pryv.credentials.username.should.equal('pryv_user');
      done();
    });
  });

  it('should return 404 when asked about a non existent user', function (done) {
    request(app)
        .get('/user-settings/testuser2')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.error.should.equal('no such user');
      done();
    });
  });

  it('should update user info', function (done) {
    request(app)
        .put('/user-settings/pryv_user')
        .set('Accept', 'application/json')
        .send({'twitter': {'filterOption': 'new'}, 'pryv': {'streamId': 'new streamId'}})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err) {
      if (err) { return done(err); }
      done();
    });
  });

  it('should find updated info in db', function (done) {
    usersStorage.readUser({'pryv.streamId': 'new streamId'}, function (result) {
      if (result) {
        result.twitter.filterOption.should.equal('new');
        done();
      }
    });
  });

  it('should detect wrong JSON when updating', function (done) {
    request(app)
        .put('/user-settings/pryv-username')
        .set('Accept', 'application/json')
        .send({'truc': {'filter': 'new filter'}})
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function (err, res) {
      if (err) { return done(err); }
      res.body.should.have.property('id');
      done();
    });
  });

  after(function (done) {
    usersStorage.deleteUser({'pryv.credentials.auth': 'auth_string'}, function (result) {
      result.should.have.property('ok');
      done();
    });
  });

});
