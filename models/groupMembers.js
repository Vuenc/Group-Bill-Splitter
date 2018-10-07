// TODO good way?
let mongoose = require('mongoose');

let GroupMemberSchema = new mongoose.Schema({
        groupEventId: mongoose.Schema.Types.ObjectId,
        name: String,
        // Positive if this member advanced money overall, negative if this member has to pay money back
        summedBalance: mongoose.Schema.Types.Decimal128 // TODO terminology;
    },
    {
        collection: 'groupmembersdb'
    }
);

module.exports = mongoose.model('GroupMember', GroupMemberSchema);