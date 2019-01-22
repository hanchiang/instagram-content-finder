const instaUtils = require('./insta');
const fileUtils = require('./file');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// min, max in milliseconds
function randomInt(min = 100, max) {
  return Math.round(Math.random() * (max - min) + min);
}

const prettyPrintJson = json => JSON.stringify(json, null, 2);

const parseJson = jsonString => new Promise(
  resolve => setTimeout(resolve(JSON.parse(jsonString)), 0)
);

module.exports = {
  ...instaUtils,
  ...fileUtils,
  sleep,
  randomInt,
  prettyPrintJson,
  parseJson
};
