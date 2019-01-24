/* eslint-disable no-await-in-loop, arrow-parens, max-len, object-property-newline */

const fs = require('fs');
const path = require('path');

const axios = require('axios');
const htmlparser = require('htmlparser2');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const UserViral = require('./model');

const {
  OUTPUT_FOLDER, INPUT_FOLDER, BASE_URL, POST_URL, GRAPHQL_URL,
  VIRAL_THRESHOLD, NUM_TO_SCRAPE, NUM_TO_CALC_AVERAGE_ENGAGEMENT,
  PROFILE_MEDIA_QUERY_HASH,
  MAX_MEDIA_LIMIT, USER_AGENT
} = require('./constants');

const {
  // insta utils
  apiErrorHandler,
  getInstagramGISHash, getProfileMediaVariables, httpHeaders,
  // file utils
  writeToFile, readInput, handleCreateFolder, getOutputFilePath,
  // index
  prettyPrintJson, sleep, randomInt, parseJson
} = require('./utils');

axios.defaults.headers.common['user-agent'] = USER_AGENT;
const userViral = new UserViral();

/**
 * Adds post to list of viral posts
 * @param {array} edges
 */
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

/**
 * Helps to parse window._sharedData to retrieve user's info
 * @param {string} data
 */
function retrieveUserWebInfoHelper(data) {
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
            await writeToFile('user_web_data_sample.txt', prettyPrintJson(userViral.userWebData));
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

/**
 * Retrieve user's info from window._sharedData
 * @param {string} data
 */
async function retrieveUserWebInfo(data) {
  try {
    await retrieveUserWebInfoHelper(data);
  } catch (err) {
    console.log(err);
    throw new Error('Oops! Error occurred while retrieving user web info');
  }
}

/**
 * Instagram's graphql endpoint for getting user's media
 * @param {int} numMedia
 * @param {string} endCursor
 */
async function getProfileMedia(numMedia, endCursor) {
  const queryVariables = getProfileMediaVariables(userViral.userId, numMedia, endCursor);
  const xInstagramGIS = getInstagramGISHash(userViral.rhxGis, queryVariables);

  // https://www.instagram.com/graphql/query/?query_hash=${hash}&variables=${encoded JSON string variables}
  const url = `${GRAPHQL_URL}query_hash=${PROFILE_MEDIA_QUERY_HASH}&variables=${encodeURIComponent(queryVariables)}`;
  const config = {
    headers: httpHeaders(xInstagramGIS, userViral.username)
  };
  const res = await axios.get(url, config);
  return res.data;
}

async function downloadPosts() {
  console.log(`Accessing media data of user: ${userViral.username}`);

  let result = await getProfileMedia(MAX_MEDIA_LIMIT, '');
  const posts = result.data.user.edge_owner_to_timeline_media;

  let { page_info: pageInfo, edges } = posts;
  userViral.currScrapeCount += edges.length;
  appendPosts(edges);
  console.log(`${userViral.username} has ${userViral.numPosts} posts!`);
  console.log('Current scrape count:', userViral.currScrapeCount);

  while (pageInfo.has_next_page && userViral.currScrapeCount < NUM_TO_SCRAPE) {
    const wait = randomInt(100, 400);
    console.log(`Sleeping for ${wait / 1000} seconds`);
    await sleep(wait);

    result = await getProfileMedia(MAX_MEDIA_LIMIT, pageInfo.end_cursor);
    ({ page_info: pageInfo, edges } = result.data.user.edge_owner_to_timeline_media);
    userViral.currScrapeCount += edges.length;
    appendPosts(edges);
    console.log('Current scrape count:', userViral.currScrapeCount);
  }
  console.log(`Number of media scraped: ${userViral.currScrapeCount}\n`);
  writeToFile('profile_media_sample.txt', result);
}

/**
 * Calculate average engagement of 12 most recent posts
 */
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

/**
 * Filters posts to retrieve viral posts
 */
function getViralContent() {
  for (const post of userViral.posts) {
    if (post.numLikes > (1 + VIRAL_THRESHOLD) * userViral.averageLikes) {
      userViral.viralPosts.push(post);
    }
  }
  userViral.viralPosts.sort((a, b) => b.numLikes - a.numLikes);
  console.log(`Number of viral posts: ${userViral.viralPosts.length}\n`);
}

async function saveViralContent() {
  await writeToFile('viral_posts_sample.txt', prettyPrintJson(userViral.viralPosts));

  const header = [
    { id: 'numLikes', title: 'Likes' },
    { id: 'numComments', title: 'Comments' },
    { id: 'url', title: 'Url' },
  ];

  await handleCreateFolder([path.join(__dirname, OUTPUT_FOLDER, userViral.username)]);

  const filename = getOutputFilePath(userViral.numFollowers, userViral.averageLikes, userViral.averageComments);
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, OUTPUT_FOLDER, userViral.username, filename),
    header,
  });

  return csvWriter.writeRecords(userViral.viralPosts)
    .then(() => console.log(`Viral posts saved to file: ${filename}`))
    .catch(error => console.log(error));
}

async function work() {
  if (userViral.username === '') {
    return;
  }
  try {
    // 1. Retrieve profile page
    console.log(`Retrieving profile url user: ${userViral.username}`);
    const profileRes = await axios.get(`${BASE_URL}${userViral.username}`);

    // 2. Scrape `id` and `rhx_gis` from profile that is stored in 'window._sharedData' in the html source
    console.log(`Retrieving info of user: ${userViral.username}`);
    await retrieveUserWebInfo(profileRes.data);

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

    console.log(`Completed work for ${userViral.username}!`);
  } catch (err) {
    apiErrorHandler(err);
  }
}


async function main() {
  const rescrape = false;
  await handleCreateFolder([path.join(__dirname, `${INPUT_FOLDER}`), path.join(__dirname, `${OUTPUT_FOLDER}`)]);

  if (!rescrape) {
    const inputfile = path.join(__dirname, `${INPUT_FOLDER}/input.txt`);
    const usernames = await readInput(inputfile);

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

module.exports = {
  main, appendPosts, retrieveUserWebInfo, getProfileMedia, downloadPosts,
  calcProfileStats, getViralContent, saveViralContent
};
