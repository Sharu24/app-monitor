const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
const util = require('util');

const lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const deleteFile = util.promisify(fs.unlink);
const readdir = util.promisify(fs.readdir);

lib.create = async (dir, file, data) => {
    try {
        const filePath = lib.baseDir + dir + '/' + file + '.json';
        const stringData = JSON.stringify(data);
        await writeFile(filePath, stringData);
        return Promise.resolve();
    }
    catch(err) {
        return Promise.reject();
    }
}

lib.read = async (dir, file) => {
    try {
        const filePath = lib.baseDir + dir + '/' + file + '.json';
        let fileData = await readFile(filePath);
        fileData = helpers.parseJsonToObject(fileData);
        return Promise.resolve(fileData);
    }
    catch(err) {
        return false;
    }
}

lib.update = async (dir, file, data) => {
    try {
        const filePath = lib.baseDir + dir + '/' + file + '.json';
        const stringData = JSON.stringify(data);
        await writeFile(filePath, stringData);
        return Promise.resolve();
    }
    catch(err) {
        return Promise.reject();
    }
}

lib.delete = async (dir, file) => {
    try {
        const filePath = lib.baseDir + dir + '/' + file + '.json';
        await deleteFile(filePath);
        return Promise.resolve();
    }
    catch(err) {
        return Promise.reject();
    }
}

module.exports = lib;