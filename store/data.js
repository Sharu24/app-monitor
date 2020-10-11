const fs = require("fs");
const path = require("path");
const util = require("util");
const helpers = require("../lib/helpers");

// Promisify all the fs operations
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const deleteFile = util.promisify(fs.unlink);
const readdir = util.promisify(fs.readdir);

const lib = {};

// Define Base Directory
lib.baseDir = path.join(__dirname, "/../.data/");

/**--------------------------------------------------------
 * Add a User and store it
 *
 * @param {string} directory
 * @param {string} file
 * @param {string} data
 * @returns {string} Promise
 ----------------------------------------------------------*/
lib.create = async (dir, file, data) => {
  try {
    const filePath = lib.baseDir + dir + "/" + file + ".json";
    const stringData = JSON.stringify(data);
    await writeFile(filePath, stringData);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject();
  }
};

/**--------------------------------------------------------
 * Read a User and return user details
 *
 * @param {string} directory
 * @param {string} file
 * @returns {string} Promise with user Details
 ----------------------------------------------------------*/
lib.read = async (dir, file) => {
  try {
    const filePath = lib.baseDir + dir + "/" + file + ".json";
    let fileData = await readFile(filePath);
    fileData = helpers.parseJsonToObject(fileData);
    return Promise.resolve(fileData);
  } catch (err) {
    return false;
  }
};

/**--------------------------------------------------------
 * Update user Details
 *
 * @param {string} directory
 * @param {string} file
 * @param {string} data
 * @returns {string} Promise
 ----------------------------------------------------------*/
lib.update = async (dir, file, data) => {
  try {
    const filePath = lib.baseDir + dir + "/" + file + ".json";
    const stringData = JSON.stringify(data);
    await writeFile(filePath, stringData);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject();
  }
};

/**--------------------------------------------------------
 * Delete a user
 *
 * @param {string} directory
 * @param {string} file
 * @returns {string} Promise
 ----------------------------------------------------------*/
lib.delete = async (dir, file) => {
  try {
    const filePath = lib.baseDir + dir + "/" + file + ".json";
    await deleteFile(filePath);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject();
  }
};

/**--------------------------------------------------------
 * Read all the files in a directory (for Service Workers)
 *
 * @param {string} directory
 * @returns {string} Promise with files under the directory
 ----------------------------------------------------------*/
lib.list = async dir => {
  try {
    const dirName = lib.baseDir + dir + "/";
    const files = await readdir(dirName);
    if (!files || !files.length) {
      return Promise.resolve([]);
    }
    const trimmedFileNames = [];
    files.forEach(file => {
      trimmedFileNames.push(file.replace(".json", ""));
    });
    return Promise.resolve(trimmedFileNames);
  } catch (error) {
    console.error(error);
    Promise.resolve([]);
  }
};

module.exports = lib;
