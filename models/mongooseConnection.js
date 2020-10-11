// Snippet adapted from the dotenv documentation to ensure that values from .env file are not shadowed by global
// environment variables - not in use now because of Heroku deployment
const fs = require('fs');
const dotenv = require('dotenv')
    .config(); // Needed to load local variables automatically
const envConfig = process.env;
    // Way to do load environment variables only from local file: = dotenv.parse(fs.readFileSync('.env'));
const mongoose = require('mongoose');

let mongodbUri = 'mongodb+srv://' + envConfig.GBS_ATLAS_DB_USER
    + ':' + envConfig.GBS_ATLAS_DB_PASSWORD + '@'  + envConfig.GBS_ATLAS_SERVER_URL + '/' + envConfig.GBS_ATLAS_DB_NAME
    + '?retryWrites=true&w=majority';

mongoose.connect(mongodbUri, {useNewUrlParser: true});
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('Successfully connected to [' + db.name + ']');
});

module.exports = db;
