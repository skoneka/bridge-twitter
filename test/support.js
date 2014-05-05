var replay = require('replay');

exports.setupReplay = function setupReplay(mode) {
  replay.fixtures = __dirname + '/fixtures';
  mode = mode || process.env.REPLAY_MODE;
  if (mode) {
    replay.mode = mode;
  }
};
