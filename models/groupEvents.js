let mongoose = require('mongoose');

let GroupEventSchema = new mongoose.Schema({
        name: String,
        currencyPrefix: String,
        groupMembers: [{id: Number, name: String}], // TODO best way to do this?
    },
    {
        collection: 'groupeventsdb'
    }
);

module.exports = mongoose.model('GroupEvent', GroupEventSchema);