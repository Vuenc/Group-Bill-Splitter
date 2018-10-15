let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true},
        amount: {type: mongoose.Schema.Types.Decimal128, required: true},
        payingGroupMember: {type: mongoose.Schema.Types.ObjectId, required: true},
        date: {type: Date, default: null},
        description: {type: String, default: null},
        sharingGroupMembers: {type: [mongoose.Schema.Types.ObjectId], default: []}
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);