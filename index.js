/* eslint-disable no-await-in-loop, arrow-parens, max-len */

const fs = require('fs');
const path = require('path');

const axios = require('axios');
const htmlparser = require('htmlparser2');
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const numeral = require('numeral');

const {
  MOMENT_FORMAT, OUTPUT_FOLDER, INPUT_FOLDER, BASE_URL, POST_URL, GRAPHQL_URL,
  VIRAL_THRESHOLD, NUM_TO_SCRAPE, NUM_TO_CALC_AVERAGE_ENGAGEMENT,
  PROFILE_MEDIA_QUERY_HASH,
  MAX_MEDIA_LIMIT, USER_AGENT
} = require('./constants');

const {
  // insta utils
  numeralNumberformat, apiErrorHandler,
  getInstagramGISHash, getProfileMediaVariables, httpHeaders,
  // file utils
  writeToFile, readInput, handleCreateFolder, writeFileErrorCb,
  // index
  prettyPrintJson, sleep, randomInt, parseJson
} = require('./utils');


axios.defaults.headers.common['user-agent'] = USER_AGENT;

class UserViral {
  constructor() {
    // viral info
    this.currScrapeCount = 0;
    this.posts = [];
    this.viralPosts = [];
    // user info
    this.userId = '';
    this.username = '';
    this.numPosts = '';
    this.numFollowers = 0;
    this.numFollowing = 0;
    this.averageLikes = 0;
    this.averageComments = 0;
    this.medianLikes = 0;
    this.medianComments = 0;
    this.rhxGis = '';
    // from window._sharedData object in user profile page
    this.userSharedData = {};
    // User-specific data from userSharedData
    this.userWebData = {};
  }

  init() {
    this.currScrapeCount = 0;
    this.posts = [];
    this.viralPosts = [];
    this.userId = '';
    this.username = '';
    this.numPosts = 0;
    this.numFollowers = 0;
    this.numFollowing = 0;
    this.averageLikes = 0;
    this.averageComments = 0;
    this.medianLikes = 0;
    this.medianComments = 0;
    this.rhxGis = '';
    this.userSharedData = {};
    this.userWebData = {};
  }
}

const userViral = new UserViral();


function appendPosts(edges) {
  for (const edge of edges) {
    const { node } = edge;
    const post = {
      id: node.id,
      userId: node.owner.id,
      isVideo: node.is_video,
      numComments: node.edge_media_to_comment.count,
      numLikes: node.edge_media_preview_like.count,
      url: `${POST_URL}${node.shortcode}`
    };
    if (node.is_video) {
      post.videoViews = node.video_view_count;
    } else {
      post.videoViews = 0;
    }
    userViral.posts.push(post);
  }
}

// erm parser is async..?
/**
 *
 * @param {string} data
 */
function retrieveWebInfoHelper(data) {
  return new Promise((resolve, reject) => {
    let seenSharedData = false;

    const parser = new htmlparser.Parser({
      onopentag(name, attribs) {
        // eslint-disable-next-line no-empty
        if (name === 'script' && attribs.type === 'text/javascript') { }
      },
      async ontext(text) {
        const textToScan = 'window._sharedData = ';
        if (text.substring(0, textToScan.length) === textToScan) {
          const regex = /window\._sharedData = (.*);/;
          const match = text.match(regex);
          if (match) {
            const json = await parseJson(match[1]);
            seenSharedData = true;
            userViral.userSharedData = json;
            userViral.userWebData = json.entry_data.ProfilePage[0].graphql.user;

            userViral.rhxGis = json.rhx_gis;
            userViral.userId = userViral.userWebData.id;
            userViral.numPosts = userViral.userWebData.edge_owner_to_timeline_media.count;
            userViral.numFollowers = userViral.userWebData.edge_followed_by.count;
            userViral.numFollowing = userViral.userWebData.edge_follow.count;
            writeToFile('user_web_data_sample.txt', prettyPrintJson(userViral.userWebData), writeFileErrorCb);
            resolve();
          } else {
            reject("Oops! Unable to find user's web data");
          }
        }
      },
      onend() {
        if (seenSharedData) {
          reject('Not matched');
        }
      }
    });
    parser.write(data);
    parser.end();
  });
}

// data = profile page's `response.data` from axios
async function retrieveUserWebInfo(data) {
  try {
    await retrieveWebInfoHelper(data);
  } catch (err) {
    console.log(err);
    throw new Error('Oops! Error occurred while retrieving user web info');
  }
}

// GRAPHQL API call
async function getProfileMedia(numMedia, endCursor) {
  const queryVariables = getProfileMediaVariables(userViral.userId, numMedia, endCursor);
  const xInstagramGIS = getInstagramGISHash(userViral.rhxGis, queryVariables);

  // https://www.instagram.com/graphql/query/?query_hash=${hash}&variables=${encoded JSON string variables}
  const url = `${GRAPHQL_URL}query_hash=${PROFILE_MEDIA_QUERY_HASH}&variables=${encodeURIComponent(queryVariables)}`;
  const config = {
    headers: httpHeaders(xInstagramGIS, userViral.username)
  };
  const res = await axios.get(url, config);
  writeToFile('profile_media_sample.txt', prettyPrintJson(res.data), writeFileErrorCb);

  const edgeOwnerToTimelineMedia = res.data.data.user.edge_owner_to_timeline_media;
  return edgeOwnerToTimelineMedia;
}

async function downloadPosts() {
  console.log(`Accessing media data of user: ${userViral.username}`);

  const result = await getProfileMedia(MAX_MEDIA_LIMIT, '');

  let { page_info: pageInfo, edges } = result;
  // userViral.numPosts = count;
  userViral.currScrapeCount += edges.length;
  appendPosts(edges);
  console.log(`${userViral.username} has ${userViral.numPosts} posts!`);
  console.log('Current scrape count:', userViral.currScrapeCount);

  while (pageInfo.has_next_page && userViral.currScrapeCount < NUM_TO_SCRAPE) {
    const wait = randomInt(100, 400);
    console.log(`Sleeping for ${wait / 1000} seconds`);
    await sleep(wait);

    ({ page_info: pageInfo, edges } = await getProfileMedia(MAX_MEDIA_LIMIT, pageInfo.end_cursor));
    userViral.currScrapeCount += edges.length;
    appendPosts(edges);
    console.log('Current scrape count:', userViral.currScrapeCount);
  }
  console.log(`Number of media scraped: ${userViral.currScrapeCount}\n`);
}

// Calculate average engagement of 12 most recent posts
async function calcProfileStats() {
  let totalLikes = 0;
  let totalComments = 0;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < NUM_TO_CALC_AVERAGE_ENGAGEMENT; i++) {
    totalLikes += userViral.posts[i].numLikes;
    totalComments += userViral.posts[i].numComments;
  }
  userViral.averageLikes = totalLikes / NUM_TO_CALC_AVERAGE_ENGAGEMENT;
  userViral.averageComments = totalComments / NUM_TO_CALC_AVERAGE_ENGAGEMENT;

  console.log(`Statistics for ${userViral.username}.\nFollowers: ${userViral.numFollowers}. \
    Following: ${userViral.numFollowing}. Average likes: ${userViral.averageLikes}, \
    Average comments: ${userViral.averageComments}`);
}

function getViralContent() {
  for (const post of userViral.posts) {
    if (post.numLikes > (1 + VIRAL_THRESHOLD) * userViral.averageLikes) {
      userViral.viralPosts.push(post);
    }
  }
  userViral.viralPosts.sort((a, b) => b.numLikes - a.numLikes);
  console.log(`Number of viral posts: ${userViral.viralPosts.length}\n`);
}

function saveViralContent() {
  writeToFile('viral_posts_sample.txt', prettyPrintJson(userViral.viralPosts), writeFileErrorCb);

  const header = [
    { id: 'numLikes', title: 'Likes' },
    { id: 'numComments', title: 'Comments' },
    { id: 'url', title: 'Url' },
  ];

  handleCreateFolder([path.join(__dirname, OUTPUT_FOLDER, userViral.username)]);

  const filename = `${numeral(userViral.numFollowers).format(numeralNumberformat(userViral.numFollowers))}-\
  ${numeral(Math.round(userViral.averageLikes)).format(numeralNumberformat(userViral.averageLikes))}-\
  ${numeral(Math.round(userViral.averageComments)).format(numeralNumberformat(userViral.averageComments))}-\
  ${moment().format(MOMENT_FORMAT)}`;

  const csvWriter = createCsvWriter({
    path: path.join(__dirname, OUTPUT_FOLDER, userViral.username, filename),
    header,
  });

  return csvWriter.writeRecords(userViral.viralPosts)
    .then(() => console.log(`Viral posts saved to file: ${filename}`))
    .catch(error => console.log(error));
}

async function main() {
  handleCreateFolder([path.join(__dirname, `${INPUT_FOLDER}`), path.join(__dirname, `${OUTPUT_FOLDER}`)]);

  try {
    // 1. Retrieve profile page
    console.log(`Retrieving profile url user: ${userViral.username}`);
    let res = await axios.get(`${BASE_URL}${userViral.username}`);

    // 2. Scrape `id` and `rhx_gis` from profile that is stored in 'window._sharedData' in the html source
    console.log(`Retrieving info of user: ${userViral.username}`);
    res = await retrieveUserWebInfo(res.data);

    if (userViral.userWebData.is_private) {
      console.log(`User '${userViral.username}' is private. Skipping...`);
      return;
    }
    if (userViral.numPosts < NUM_TO_CALC_AVERAGE_ENGAGEMENT) {
      console.log(`Did not meet minimum of ${NUM_TO_CALC_AVERAGE_ENGAGEMENT} posts. Skipping..`);
      return;
    }

    console.log(`id: ${userViral.userId}, rhx_gis: ${userViral.rhxGis}\n`);

    // 3. Make graphql request to get media data of a profile and append to `posts`
    await downloadPosts();

    // 4. Calculate profile stats
    await calcProfileStats();

    // 5. Get viral content
    getViralContent();

    // 6. Save viral content to file
    await saveViralContent();
  } catch (err) {
    apiErrorHandler(err);
  }
}

async function work() {
  if (userViral.username !== '') {
    await main();
    console.log(`Completed work for ${userViral.username}!`);
  }
}

async function start() {
  const rescrape = false;
  if (!rescrape) {
    const usernames = readInput();

    for (const username of usernames) {
      userViral.init();
      userViral.username = username.trim();

      const wait = randomInt(200, 1000);
      console.log(`Sleeping for ${wait / 1000} second\n`);
      await sleep(wait);
      await work();
    }
  } else {
    const directories = getDirectories(`${OUTPUT_FOLDER}`);
    await rescrapeAllUsers(directories);
  }
}

start();

// Functions to handle rescraping
async function rescrapeAllUsers(directories) {
  for (const directory of directories) {
    userViral.init();
    userViral.username = directory;
    await work();
  }
  console.log('All done!');
}

function isDirectory(source) {
  return fs.statSync(source).isDirectory();
}

function getDirectories(source) {
  return fs.readdirSync(source).map(file => path.join(__dirname, source, file))
    .filter(isDirectory)
    .map(directory => {
      if (path.sep === '\\') return directory.split('\\')[1];
      return directory.split('/')[1];
    });
}
