let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'GroupEvent'},
        amount: {type: mongoose.Schema.Types.Decimal128, required: true},
        payingGroupMember: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'GroupMember'},
        date: {type: Date, default: null},
        description: {type: String, default: null},
        sharingGroupMembers: {type: [{type: mongoose.Schema.Types.ObjectId, ref: 'GroupMember'}], default: []}
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);