let mongoose = require('mongoose');

let GroupMemberSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'GroupEvent'},
        name: {type: String, required: true},
        email: {type: String, required: false}
    },
    {
        collection: 'groupmembersdb'
    }
);

module.exports = mongoose.model('GroupMember', GroupMemberSchema);
