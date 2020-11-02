let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        groupEventId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'GroupEvent'},
        amount: {type: mongoose.Schema.Types.Decimal128, required: true},
        payingGroupMember: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'GroupMember'},
        date: {type: Date, default: null},
        description: {type: String, default: null},
        sharingGroupMembers: {type: [{type: mongoose.Schema.Types.ObjectId, ref: 'GroupMember'}], default: []},
        isDirectPayment: {type: Boolean, default: false},
        proportionalSplitting: {
            type: {
                splitType: {
                    type: String, enum: ['percentages', 'amounts'], required: true
                },
                percentages: {
                    type: [{
                        groupMember: {type: mongoose.Schema.Types.ObjectId, ref: 'GroupMember', required: true},
                        percentage: {type: mongoose.Schema.Types.Decimal128, required: true}
                    }]
                },
                amounts: {
                    type: [{
                        groupMember: {type: mongoose.Schema.Types.ObjectId, ref: 'GroupMember', required: true},
                        amount: {type: mongoose.Schema.Types.Decimal128, required: true}
                    }]
                }
            },
            required: false
        },
        /*
            Schema version 1: original version
            Schema version 2: added (isDirectPayment: Boolean) field
            Schema version 3: added proportionalSplitting field
         */
        schemaVersion: {type: String, default: "1"} //
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
