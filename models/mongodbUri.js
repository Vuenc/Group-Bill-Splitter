require('dotenv').config();

let mongodbUri = 'mongodb://' + process.env.DB_USER
    + ':' + process.env.DB_PASSWORD + '@ds223253.mlab.com:23253/' + process.env.DB_NAME;

module.exports = mongodbUri;