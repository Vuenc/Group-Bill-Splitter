let mongoose = require('mongoose');

let GroupMemberSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true},
        name: {type: String, required: true},
        // Positive if this member advanced money overall, negative if this member has to pay money back
        summedBalance: mongoose.Schema.Types.Decimal128 // TODO terminology;
    },
    {
        collection: 'groupmembersdb'
    }
);

module.exports = mongoose.model('GroupMember', GroupMemberSchema);