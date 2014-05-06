/*global describe, it*/

var should = require('should'),
    nock = require('nock'),
    replay = require('replay'),
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
]

describe('Pryv Library', function () {
  before(function () {
    replay.mode = 'replay';
  });

  after(function () {
    replay.mode = 'bloody';
  });

  describe('forwardTweet', function () {
    this.timeout(5000);

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
    var user2 = {
      streamId: 'test',
      credentials: {
        username: 'perkikiki',
        auth: 'VVEQmJD5T5'
      }
    };

    it('should send a batch of events to the activity server', function (done) {
      pryv.sendFilteredData(user.pryv, formatedData, function (err, response) {
        response.should.have.property('eventsForwarded');
        done();
      });
    });

    /* error handling is not yet implemented on the api server.
     * The actual response is two events without certain properties (id, createdby, ..)
     */
    // it('should report INVALID_ACCESS_TOKEN response', function (done) {
    //   pryv.sendFilteredData(user2, formatedData, function (err, response) {
    //     response.should.have.property('id', 'invalid-access-token');
    //     done();
    //   });
    // });

    it('should avoid forwarding duplicate tweets', function (done) {
      pryv.removeDuplicateEvents(user.pryv, JSON.stringify(formatedData), function (user, dataArray) {
        dataArray.should.have.lengthOf(0);
        done();
      });
    });
  });
});