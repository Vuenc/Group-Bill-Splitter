let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: String, // TODO correct?
        // TODO name: String,
        amount: mongoose.Schema.Types.Decimal128,
        payingGroupMember: {Number, String}, // TODO best way to do this?
        date: Date,
        description: String,
        sharingGroupMembers: [{id: Number, name: String}], // TODO best way to do this?
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);