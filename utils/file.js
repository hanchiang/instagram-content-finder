/* eslint-disable no-await-in-loop */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const numeral = require('numeral');
const moment = require('moment');

const { ENCODING, INPUT_FOLDER, MOMENT_FORMAT } = require('../constants');

const access = promisify(fs.access);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

function writeToFile(filepath, data) {
  const writeFile = promisify(fs.writeFile);

  return writeFile(filepath, data)
    .then(() => console.log(`Written to file: ${filepath}`))
    .catch(err => { throw err; });
}

async function readInput() {
  const filepath = path.join(__dirname, '..', `${INPUT_FOLDER}/input.txt`);

  try {
    await access(filepath);
    const data = await readFile(filepath, ENCODING);
    return data.split('\n');
  } catch (err) {
    throw new Error('Please create a file \'input.txt\' in the \'input\' folder');
  }
}

/**
 * Creates folder if it doesn't exist
 * @param {string []} paths
 */
async function handleCreateFolder(paths) {
  for (const filepath of paths) {
    try {
      await access(filepath);
    } catch (err) {
      await mkdir(filepath);
      console.log(`Folder is created at ${filepath}`);
    }
  }
}

// eslint-disable-next-line consistent-return
const numeralNumberformat = (number) => {
  if (number < 1000) return '0a';
  if (number < 10000) return '0.0a';
  if (number < 1000000) return '0a';
  if (number >= 1000000) return '0.0a';
};

function getOutputFilePath(numFollowers, averageLikes, averageComments) {
  return `${numeral(numFollowers).format(numeralNumberformat(numFollowers))}-\
  ${numeral(Math.round(averageLikes)).format(numeralNumberformat(averageLikes))}-\
  ${numeral(Math.round(averageComments)).format(numeralNumberformat(averageComments))}-\
  ${moment().format(MOMENT_FORMAT)}`;
}

module.exports = {
  writeToFile, readInput, handleCreateFolder, getOutputFilePath
};
