let mongoose = require('mongoose');

let GroupEventSchema = new mongoose.Schema({
        name: String,
        currencyPrefix: String,
        // groupMembers: [mongoose.Schema.Types.ObjectId], // TODO best way to do this?
    },
    {
        collection: 'groupeventsdb'
    }
);

module.exports = mongoose.model('GroupEvent', GroupEventSchema);