let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true},
        amount: {type: mongoose.Schema.Types.Decimal128, required: true},
        payingGroupMember: {type: mongoose.Schema.Types.ObjectId, required: true},
        date: Date,
        description: String,
        sharingGroupMembers: [mongoose.Schema.Types.ObjectId]
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);