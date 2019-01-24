/* eslint-disable no-undef, no-await-in-loop, arrow-parens */

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const { expect } = require('chai');
const sinon = require('sinon');

const fileUtils = require('../utils/file');
const { ENCODING } = require('../constants');

// Promisified functions
const access = promisify(fs.access);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// Files and folders created during testing
const outputfile = 'output.txt';
const inputfile = 'input.txt';
const filepaths = [inputfile, outputfile];
const folderpaths = ['folder1', 'folder2', 'folder3'];

async function cleanupFolders() {
  for (const p of folderpaths) {
    await access(path.join(__dirname, p));
    await rmdir(path.join(__dirname, p));
  }
}

async function cleanupFiles() {
  for (const f of filepaths) {
    await access(path.join(__dirname, f));
    await unlink(path.join(__dirname, f));
  }
}

/**
 *
 * @param {string} p file path
 * @param {string} data
 */
function writeToFile(p, data) {
  return writeFile(p, data)
    .then(() => {})
    .catch(err => { throw err; });
}

/**
 *
 * @param {string} p file path
 */
async function readFromFile(p) {
  try {
    await access(p);
    const data = await readFile(p, ENCODING);
    return data.split('\n');
  } catch (err) {
    throw new Error(`Oops! File at ${p} does not exist.`);
  }
}

/**
 * Main test suite
 */
describe('Utils tests', () => {
  after(async () => {
    await cleanupFolders();
    await cleanupFiles();
  });

  describe('Utils file tests', () => {
    it('should read input file correctly', async () => {
      const filepath = path.join(__dirname, inputfile);
      const writeContent = 'Hi there!';
      await writeToFile(filepath, writeContent);

      const data = await fileUtils.readInput(filepath);
      expect(data).to.eql([writeContent]);
    });

    it('Should write to file correctly', async () => {
      const filepath = path.join(__dirname, outputfile);
      const writeContent = 'Hello world!';
      const consoleStub = sinon.stub(console, 'log');

      await fileUtils.writeToFile(filepath, writeContent);
      sinon.assert.calledOnce(consoleStub);
      consoleStub.restore();

      const data = await readFromFile(filepath);
      expect(data).to.eql([writeContent]);
    });

    it('should create one output folder', async () => {
      const consoleStub = sinon.stub(console, 'log');

      await fileUtils.handleCreateFolder([path.join(__dirname, folderpaths[0])]);
      sinon.assert.calledOnce(consoleStub);
      consoleStub.restore();

      await access(path.join(__dirname, folderpaths[0]));
    });

    it('should create multiple output folders', async () => {
      const consoleStub = sinon.stub(console, 'log');

      await fileUtils.handleCreateFolder([path.join(__dirname, folderpaths[1]),
        path.join(__dirname, folderpaths[2])]);
      sinon.assert.calledTwice(consoleStub);
      consoleStub.restore();

      await access(path.join(__dirname, folderpaths[0]));
      await access(path.join(__dirname, folderpaths[1]));
    });
  });
});
