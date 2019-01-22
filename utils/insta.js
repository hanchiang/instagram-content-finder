const crypto = require('crypto');

const { BASE_URL } = require('../constants');

// eslint-disable-next-line consistent-return
const numeralNumberformat = (number) => {
  if (number < 1000) return '0a';
  if (number < 10000) return '0.0a';
  if (number < 1000000) return '0a';
  if (number >= 1000000) return '0.0a';
};

const apiErrorHandler = (err) => {
  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx

    // console.log(err.response);
    // console.log(err.response.data);
    // console.log(err.response.status);
    // console.log(err.response.headers);

    console.log(`${err.response.status}: ${err.response.statusText}`);

    // Rate limited:
    if (err.response.data.message === 'rate limited') {
      // err.response.data.message = 'rate limited'
      // err.response.data.status = 'fail'
      // err.response.status = 429
      console.log('Rated limited!');
    }
  } else if (err.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('Request error');
    console.log(err);
    // console.log(err.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Unknown error');
    // console.log('Error', err.message);
    console.log(err);
  }
  // console.log(err.config);
};

function httpHeaders(xInstagramGIS, username) {
  return {
    'x-instagram-gis': xInstagramGIS,
    referer: `${BASE_URL}${username}`,
  };
}

// queryVariables = stringified JSON
const getInstagramGISHash = (rhxGis, queryVariables) => crypto
  .createHash('md5')
  .update(`${rhxGis}:${queryVariables}`, 'utf-8').digest('hex');

/* Get query variables for various operations  */
// Get the profile of a page
function getProfileVariables(userId) {
  return JSON.stringify({
    user_id: `${userId}`,
    include_chaining: true,
    include_reel: true,
    include_suggested_users: true,
    include_logged_out_extras: false,
    include_highlight_reels: true
  });
}

// Get the media of a page
function getProfileMediaVariables(userId, num = 12, endCursor = '') {
  return JSON.stringify({
    id: `${userId}`,
    first: num,
    after: endCursor
  });
}

function getProfileFollowersVariables(userId, num = 12) {
  return JSON.stringify({
    id: userId,
    include_reel: false,
    first: num
  });
}

function getProfileFollowingVariables(userId, num = 12) {
  return JSON.stringify({
    id: userId,
    include_reel: false,
    first: num
  });
}

module.exports = {
  httpHeaders, numeralNumberformat, apiErrorHandler, getInstagramGISHash, getProfileVariables,
  getProfileMediaVariables, getProfileFollowersVariables, getProfileFollowingVariables
};
