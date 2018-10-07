let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: mongoose.Schema.Types.ObjectId, // TODO correct?
        // TODO name: String,
        amount: mongoose.Schema.Types.Decimal128,
        payingGroupMember: mongoose.Schema.Types.ObjectId, // TODO best way to do this?
        date: Date,
        description: String,
        sharingGroupMembers: [mongoose.Schema.Types.ObjectId], // TODO best way to do this?
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);