const instaUtils = require('./insta');
const fileUtils = require('./file');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// scale random range [0, 1) by given number of seconds
function randomInt(min = 0, scale = 1000) {
  return Math.floor(Math.random() * scale + min);
}

module.exports = {
  ...instaUtils,
  ...fileUtils,
  sleep,
  randomInt
};
