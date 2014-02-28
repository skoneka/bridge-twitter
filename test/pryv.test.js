/*global describe, it*/

var should = require('should'),
    nock = require('nock'),
    pryv = require('../source/lib/pryv');

var user = {
  'twitter': {
    'filter': '+Y',
    'filterOption': 'filter',
    'credentials': [{
      'accessToken': 'atk-string',
      'accessSecret': 'ats-string',
      'username': 'twitter-user'
    }]
  },
  'pryv': {
    'streamId': 'social-twitter',
    'credentials': {
      'auth': 'auth-string',
      'username': 'pryv-user'
    }
  }
};
var data = {
  'created_at': 'Mon Jan 14 16:36:10 +0000 2013',
  'id_str': '291588476627976192',
  'text': 'this is a test +Y',
  'user': {
    'screen_name': 'testuser'
  }
};
var formatedData = [{
  time: 1358181371,
  tempRefId: '0',
  folderId: 'TPZZHj5YuM',
  type: {
    class: 'note',
    format: 'twitter'
  },
  value: {
    id: '291588476627976192',   // string ID to handle JS parsing problems
    text: 'this is a test',
    screen_name: 'testuser'
  }
},
{
  time: 1358181370,
  tempRefId: '1',
  folderId: 'TPZZHj5YuM',
  type: {
    class: 'note',
    format: 'twitter'
  },
  value: {
    id: '291588476627976193',   // string ID to handle JS parsing problems
    text: 'this is another test',
    screen_name: 'testuser2'
  }
}];

describe('forwardTweet', function () {
  this.timeout(5000);

  nock('https://pryv-user.pryv.in')
    .post('/events')
    .reply(200, {event: {id: 'test'}}, {'Content-Type': 'application/json'});

  it('should send favorite tweets to Pryv', function (done) {
    pryv.forwardTweet(user, data, function (err, createdEvent) {
      should.not.exist(err);
      should.exist(createdEvent);
      createdEvent.should.have.property('id');
      done();
    });
  });
});

describe('forwardTweetsHistory', function () {

  var pryvUser = {
    streamId: 'social-twitter',
    credentials: {
      username: 'jonmaim',
      auth: ''
    }
  };
  var pryvUser2 = {
    streamId: 'test',
    credentials: {
      username: 'jonmaim',
      auth: 'VVEQmJD5T5'
    }
  };

  //ugly but jshint likes it like that
  var data = '/TePRIdMlgf/events/batch [{' +
          '"time":1358181371,"tempRefId":"0","folderId":"TPZZHj5YuM","type":{"class":"note",' +
          '"format":"twitter"},"value":{"id":"291588476627976192","text":"this is a test",' +
          '"screen_name":"testuser"}},{"time":1358181370,"tempRefId":"1",' +
          '"folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},' +
          '"value":{"id":"291588476627976193","text":"this is another test",' +
          '"screen_name":"testuser2"}}]';
  nock('https://jonmaim.pryv.in')
    .post(data)
    .reply(200, { '0': { id: 'eTaUhq6IgM' } }, {'Content-Type': 'application/json'});

  it('should send a batch of events to the activity server', function (done) {
    pryv.sendFilteredData(pryvUser, formatedData, function (err, response) {
      response.should.have.property('0');
      done();
    });
  });

  data = '/TePRIdMlgf/events/batch [{"time":1358181371,"tempRefId":"0",' +
  '"folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},' +
  '"value":{"id":"291588476627976192","text":"this is a test","screen_name":"testuser"}},' +
  '{"time":1358181370,"tempRefId":"1","folderId":"TPZZHj5YuM","type":{"class":"note",' +
  '"format":"twitter"},"value":{"id":"291588476627976193",' +
  '"text":"this is another test","screen_name":"testuser2"}}]';

  var message = 'The access token is missing: expected an "Authorization"' +
                'header or an "auth" query string parameter.';

  nock('https://jonmaim.pryv.in')
    .post(data)
    .reply(200, {
      id: 'invalid-access-token',
      message: message
    }, {'Content-Type': 'application/json'});

  it('should report INVALID_ACCESS_TOKEN response', function (done) {
    pryv.sendFilteredData(pryvUser, formatedData, function (err, response) {
      response.should.have.property('id', 'invalid-access-token');
      done();
    });
  });

  data = '/test/events/batch [{"time":1358181371,"tempRefId":"0","folderId":"TPZZHj5YuM",' +
  '"type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976192",' +
  '"text":"this is a test","screen_name":"testuser"}},{"time":1358181370,"tempRefId":"1",' +
  '"folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},' +
  '"value":{"id":"291588476627976193","text":"this is another test","screen_name":"testuser2"}}]';
  nock('https://jonmaim.pryv.in')
    .post(data)
    .reply(200, { id: 'unknown-channel', message: 'Cannot find channel "test".' },
      {'Content-Type': 'application/json'});

  it('should report UNKNOWN_CHANNEL response', function (done) {
    pryv.sendFilteredData(pryvUser2, formatedData, function (err, response) {
      response.should.have.property('id', 'unknown-channel');
      done();
    });
  });

  it('should avoid forwarding duplicate tweets', function (done) {
    nock('https://jonmaim.pryv.in')
    .get('/TePRIdMlgf/events')
    .reply(200, [{time: 1358181371}], {'Content-Type': 'application/json'});
    pryv.removeDuplicateEvents(pryvUser, JSON.stringify(formatedData), function (user, dataArray) {
      dataArray.should.have.lengthOf(1);
      done();
    });
  });
});
