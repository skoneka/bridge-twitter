var should = require('should'),
    nock = require('nock'),
    request = require('supertest'),
    pryv = require('../source/lib/pryv'),
    usersStorage = require('../source/storage/users-storage'),
    app = require('../source/app'),
    user = {
      'twitter': {
        'filter': '+Y',
        'filterOption': '',
        'credentials': [{
          'accessToken': 'atk-string',
          'accessSecret': 'ats-string',
          'username': 'twitter-user'
        }]
      },
      'pryv': {
        'channelId': 'TePRIdMlgf',
        'folderId': 'TPZZHj5YuM',
        'credentials': {
          'auth': 'auth-string',
          'username': 'pryv-user'
        }
      }
    },
    pryvUser = {
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
    },
    formatedData = [{
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
    }],
    wrongFormatedData = [{
      ttempRefId: '0',
      folderId: 'TPZZHj5YuM',
      type: {
        class: 'note',
        format: 'twitter'
      },
      value: {
        id: '291588476627976192',   // string ID to handle JS parsing problems
        text: 'this is a test',
        screen_name: 'xa4loz'
      }
    }];


describe('forwardTweet', function(){
    this.timeout(5000);

  nock('https://pryv-user.rec.la')
    .post('/TePRIdMlgf/events {}')
    .reply(200, {id: 'VTQkjkyIuM'}, {'Content-Type': 'application/json'});

  it('should send an event to the activity server', function(done){
    pryv.forwardTweet(user, data, function(response){
      response.should.have.property('id');
      done();
    });
  })
})

describe('forwardTweetsHistory', function(){


  var pryvUser = {
      "channelId": "TePRIdMlgf",
      "folderId": "TPZZHj5YuM",
      "credentials": {
        "username": "jonmaim",
        "auth": ""
      }
    },
    pryvUser2 = {
      "channelId": "test",
      "folderId": "TPZZHj5YuM",
      "credentials": {
        "username": "jonmaim",
        "auth": "VVEQmJD5T5"
      }
    };

  nock('https://jonmaim.rec.la')
    .post('/TePRIdMlgf/events/batch [{"time":1358181371,"tempRefId":"0","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976192","text":"this is a test","screen_name":"testuser"}},{"time":1358181370,"tempRefId":"1","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976193","text":"this is another test","screen_name":"testuser2"}}]')
    .reply(200, { '0': { id: 'eTaUhq6IgM' } }, {'Content-Type': 'application/json'});

  it('should send a batch of events to the activity server', function(done){
    pryv.sendFilteredData(pryvUser, formatedData, function(err, response){
      response.should.have.property('0');
      done();
    });
  })

  nock('https://jonmaim.rec.la')
    .post('/TePRIdMlgf/events/batch [{"time":1358181371,"tempRefId":"0","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976192","text":"this is a test","screen_name":"testuser"}},{"time":1358181370,"tempRefId":"1","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976193","text":"this is another test","screen_name":"testuser2"}}]')
    .reply(200, { id: 'invalid-access-token', message: 'The access token is missing: expected an "Authorization" header or an "auth" query string parameter.' }, {'Content-Type': 'application/json'});

  it('should report INVALID_ACCESS_TOKEN response', function(done){
    pryv.sendFilteredData(pryvUser, formatedData, function(err, response){
      response.should.have.property('id', 'invalid-access-token')
      done();
    });
  })

  nock('https://jonmaim.rec.la')
    .post('/test/events/batch [{"time":1358181371,"tempRefId":"0","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976192","text":"this is a test","screen_name":"testuser"}},{"time":1358181370,"tempRefId":"1","folderId":"TPZZHj5YuM","type":{"class":"note","format":"twitter"},"value":{"id":"291588476627976193","text":"this is another test","screen_name":"testuser2"}}]')
    .reply(200, { id: 'unknown-channel', message: 'Cannot find channel "test".' }, {'Content-Type': 'application/json'});

  it('should report UNKNOWN_CHANNEL response', function(done){
    pryv.sendFilteredData(pryvUser2, formatedData, function(err, response){
      response.should.have.property('id', 'unknown-channel')
      done();
    });
  })

  it('should avoid forwarding duplicate tweets', function(done){
    nock('https://jonmaim.rec.la')
    .get('/TePRIdMlgf/events')
    .reply(200, [{time:1358181371}], {'Content-Type': 'application/json'});
    pryv.removeDuplicateEvents(pryvUser, JSON.stringify(formatedData), function(user, dataArray){
      dataArray.should.have.lengthOf(1);
      done();
    })
  })
})