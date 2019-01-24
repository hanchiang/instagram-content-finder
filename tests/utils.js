/* eslint-disable no-undef, no-await-in-loop */

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const fileUtils = require('../utils/file');

const access = promisify(fs.access);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

// Files and folders created during testing
const folderpath = ['folder1', 'folder2', 'folder3'];
const filepath = 'testing.txt';

async function cleanupFolders() {
  for (const p of folderpath) {
    await access(path.join(__dirname, p));
    await rmdir(path.join(__dirname, p));
  }
}

async function cleanupFiles() {
  await access(path.join(__dirname, filepath));
  await unlink(path.join(__dirname, filepath));
}

describe('Utils tests', () => {
  after(async () => {
    await cleanupFolders();
    await cleanupFiles();
  });

  describe('Utils file tests', () => {
    it('should read input file correctly', () => {
      fileUtils.readInput();
    });

    it('Should write to file correctly', (done) => {
      const writeToPath = path.join(__dirname, filepath);

      fileUtils.writeToFile(writeToPath, 'Hello world!')
        .then(() => {
          access(writeToPath)
            .then(done)
            .catch(err => { throw err; });
        });
    });

    it('should create one output folder', async () => {
      await fileUtils.handleCreateFolder([path.join(__dirname, folderpath[0])]);
      await access(path.join(__dirname, folderpath[0]));
    });

    it('should create multiple output folders', async () => {
      await fileUtils.handleCreateFolder([path.join(__dirname, folderpath[1]),
        path.join(__dirname, folderpath[2])]);
      await access(path.join(__dirname, folderpath[0]));
      await access(path.join(__dirname, folderpath[1]));
    });
  });
});
