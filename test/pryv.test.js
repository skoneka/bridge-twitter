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
      'auth': 'VPoFEsuJRM',
      'username': 'perkikiki'
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
var formatedData = 
[ { time: 1399070017,
    streamId: 'social-twitter',
    type: 'message/twitter',
    content: 
     { id: '462359282923880448',
       'screen-name': 'xa4loz',
       text: 'ds sdffsd' } },
  { time: 1399069817,
    streamId: 'social-twitter',
    type: 'message/twitter',
    content: 
     { id: '462358441110294528',
       'screen-name': 'xa4loz',
       text: 'isudfeiuf :)' } }
];
var reply;

describe('Pryv Library', function () {

  describe('forwardTweet', function () {
    this.timeout(5000);

    nock('https://perkikiki.pryv.in:443')
      .post('/events', {
        'streamId':'social-twitter',
        'time':1358181370,
        'type':'message/twitter',
        'content':{
          'id':'291588476627976192',
          'screen-name':'testuser',
          'text':'this is a test +Y'
        }
      })
      .reply(201, {'event':{'id':'chuyoaons007glnwk2r9o20om'}},{'api-version': '0.7.19' });

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
    this.timeout(5000);

    reply = {'results':[{'event':{'time':1399070017}}]};

    nock('https://perkikiki.pryv.in:443')
      .post('/', [{
        'method':'events.create',
        'params':{
          'time':1399070017,
          'streamId':'social-twitter',
          'type':'message/twitter',
          'content':{
            'id':'462359282923880448',
            'screen-name':'xa4loz',
            'text':'ds sdffsd'
          }
        }
      },{
        'method':'events.create',
        'params':{
          'time':1399069817,
          'streamId':'social-twitter',
          'type':'message/twitter',
          'content':{
            'id':'462358441110294528',
            'screen-name':'xa4loz',
            'text':'isudfeiuf :)'
          }
        }
      }])
      .reply(200, reply, { server: 'nginx',
      'content-type': 'application/json; charset=utf-8',
      'api-version': '0.7.19' });

    it('should send a batch of events to the activity server', function (done) {
      pryv.sendFilteredData(user.pryv, formatedData, function (err, response) {
        response.should.have.property('eventsForwarded');
        done();
      });
    });

    reply = {
      'events':[{
        'time':1399070017
      },{
        'time':1399069817
      }],
      'meta':{
        'apiVersion':'0.7.19'
      }
    };

    nock('http://perkikiki.pryv.in:443')
      .get('/events?fromTime=1399069817&toTime=1399070018&streams%5B%5D=social-twitter', {})
      .reply(200, reply, { server: 'nginx',
      date: 'Thu, 08 May 2014 23:15:20 GMT',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '4861',
      connection: 'close',
      vary: 'Accept-Encoding',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Authorization, Content-Type',
      'access-control-expose-headers': 'API-Version',
      'access-control-max-age': '31536000',
      'access-control-allow-credentials': 'true',
      'api-version': '0.7.19',
      etag: '"-936805979"' });

    it('should avoid forwarding duplicate tweets', function (done) {
      pryv.removeDuplicateEvents(user.pryv, JSON.stringify(formatedData),
        function (user, dataArray) {
        dataArray.should.have.lengthOf(0);
        done();
      });
    });
  });
});