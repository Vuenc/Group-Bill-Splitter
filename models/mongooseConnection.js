// Snippet adapted from the dotenv documentation to ensure that values from .env file are not shadowed by global environment variables
const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const mongoose = require('mongoose');

let mongodbUri = 'mongodb://' + envConfig.DB_USER
    + ':' + envConfig.DB_PASSWORD + '@ds223253.mlab.com:23253/' + envConfig.DB_NAME;

mongoose.connect(mongodbUri, {useNewUrlParser: true});
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('Successfully connected to [' + db.name + ']');
});

module.exports = db;