let mongoose = require('mongoose');

let GroupEventSchema = new mongoose.Schema({
        name: {type: String, required: true},
        currencyPrefix: String,
        // groupMembers: [mongoose.Schema.Types.ObjectId], // TODO best way to do this?
    },
    {
        collection: 'groupeventsdb'
    }
);

module.exports = mongoose.model('GroupEvent', GroupEventSchema);