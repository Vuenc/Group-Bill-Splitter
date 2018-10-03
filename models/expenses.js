let mongoose = require('mongoose');

let ExpenseSchema = new mongoose.Schema({
        // TODO name: String,
        amount: decimal,
        date: Date,
        description: String,
    },
    {
        collection: 'expensesdb'
    }
);

module.exports = mongoose.model('Expense', ExpenseSchema);