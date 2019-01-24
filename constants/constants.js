/* eslint-disable object-property-newline */

const ENCODING = 'utf8';
const MOMENT_FORMAT = 'YYYYMMDD-HH:mm:ss';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36';

const OUTPUT_FOLDER = 'output';
const INPUT_FOLDER = 'input';

// URLS
const BASE_URL = 'https://www.instagram.com/';
const POST_URL = 'https://www.instagram.com/p/';
const GRAPHQL_URL = 'https://www.instagram.com/graphql/query/?';
const QUERY_ID = '17888483320059182';

// App constants
const VIRAL_THRESHOLD = 0.5;
const NUM_TO_SCRAPE = 400;
const NUM_TO_CALC_AVERAGE_ENGAGEMENT = 12;
const MIN_FOLLOWER = 15000;
const MIN_POSTS = 100;

// Instagram imposed constants and limits
const PROFILE_QUERY_HASH = '9ca88e465c3f866a76f7adee3871bdd8';
const PROFILE_MEDIA_QUERY_HASH = '42323d64886122307be10013ad2dcc44';
const PROFILE_FOLLOWERS_QUERY_HASH = '7dd9a7e2160524fd85f50317462cff9f';
const PROFILE_FOLLOWING_QUERY_HASH = 'c56ee0ae1f89cdbd1c89e2bc6b8f3d18';
const MAX_MEDIA_LIMIT = 50;

module.exports = {
  ENCODING, MOMENT_FORMAT, OUTPUT_FOLDER, INPUT_FOLDER, BASE_URL, POST_URL, GRAPHQL_URL, QUERY_ID,
  VIRAL_THRESHOLD, NUM_TO_SCRAPE, NUM_TO_CALC_AVERAGE_ENGAGEMENT, MIN_FOLLOWER, MIN_POSTS,
  PROFILE_QUERY_HASH, PROFILE_MEDIA_QUERY_HASH, PROFILE_FOLLOWERS_QUERY_HASH,
  PROFILE_FOLLOWING_QUERY_HASH, MAX_MEDIA_LIMIT, USER_AGENT
};
