const fs = require('fs');
const path = require('path');

const { ENCODING, INPUT_FOLDER } = require('../constants');

const prettyPrintJson = json => JSON.stringify(json, null, 2);

const writeToFile = (filepath, data, cb) => {
  fs.writeFile(filepath, data, cb);
};

const writeFileErrorCb = (err) => {
  if (err) throw err;
};

function readInput() {
  const filepath = path.join(__dirname, `${INPUT_FOLDER}/input.txt`);

  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath, ENCODING);
    return data.split('\n');
  }
  throw new Error('Please create a file \'input.txt\' in the \'input\' folder');
}

// array of folder paths
function handleCreateFolder(paths) {
  for (const filepath of paths) {
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath);
      console.log(`Folder is created at ${filepath}`);
    } else {
      console.log(`Folder at ${filepath} already exist.`);
    }
  }
}

module.exports = {
  prettyPrintJson, writeToFile, readInput, handleCreateFolder, writeFileErrorCb
};
