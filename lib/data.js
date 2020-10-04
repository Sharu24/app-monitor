/* This is a library file to store the data in fs and retrieve the data from fs */
const fs = require('fs');
const path = require('path');

const lib = {};

//Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, callback) => {
    const stringData = JSON.stringify(data);
    fs.writeFile(lib.baseDir + dir + '/' + file + '.json', stringData, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback("Error in Writing a File!");
        }
    })
};

//Read data from file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        callback(err, data);
    })
};

// Update the data from a file
lib.update = (dir, file, data, callback) => {
    const stringData = JSON.stringify(data);
    fs.writeFile(lib.baseDir + dir + '/' + file + '.json', stringData, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback("Error in Writing a File!");
        }
    })
};

//Delelte
lib.delete = (dir, file, callback) => {
    //Unlinking 
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback("Error in Deleting file.");
        }
    })
}


lib.delete('users', 'prash',(err) => {
    console.log(err)
})

module.exports = lib;