let mongoose = require('mongoose');

let GroupMember = require('./groupMembers');
let Expense = require('./expenses');

let GroupEventSchema = new mongoose.Schema({
        name: {type: String, required: true},
        currencyPrefix: {type: String, default: "€ "},
        // groupMembers: [mongoose.Schema.Types.ObjectId], // TODO best way to do this?
    },
    {
        collection: 'groupeventsdb'
    }
);

// Ensure that, upon deleting a GroupEvent, all associated members and expenses are also deleted
GroupEventSchema.post('remove', doc => {
    return Expense.deleteMany({groupEventId: doc._id})
        .then(() => GroupMember.deleteMany({groupEventId: doc._id}))
});

module.exports = mongoose.model('GroupEvent', GroupEventSchema);