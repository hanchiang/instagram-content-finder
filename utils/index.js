const instaUtils = require('./insta');
const fileUtils = require('./file');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  ...instaUtils,
  ...fileUtils,
  sleep,
};
