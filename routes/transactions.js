let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');
let respondToError = require("../lib/helpers").respondToError;

// Sums all the expenses to calculate which group member owes/advanced how much in total
function calculateGroupMemberDues(groupMembers, expenses) {
    // groupMemberDues is a dictionary where the dues are calculated
    let groupMemberDues = {};
    // Initialize groupMemberDues
    for (member of groupMembers) {
        groupMemberDues[member._id] = {member: member, amount: 0};
    }

    // Split each expense to the group members who share it
    for (expense of expenses) {
        // Get the members who share the expense ([] is interpreted as everybody in the group)
        let expenseSharingMembers = expense.sharingGroupMembers.length > 0
            ? expense.sharingGroupMembers : groupMembers.map(m => m._id);
        let amount = Number(expense.amount);
        for (member of expenseSharingMembers) {
            // For every sharing group member: count his part as dues (negative)
            groupMemberDues[member].amount -= amount / expenseSharingMembers.length;
        }
        // For the paying group member: count the amount as advanced money (positive)
        groupMemberDues[expense.payingGroupMember].amount += amount;
    }
    return groupMemberDues;
}

// Split the group into people who advanced money (lenders) and people who owe money (borrowers) in total
function calculateLendersBorrowers(groupMemberDues) {
    let groupMemberDuesArray = Object.keys(groupMemberDues).map(id => groupMemberDues[id]);
    let lenders = groupMemberDuesArray .filter(m => m.amount > 0);
    let borrowers = groupMemberDuesArray .filter(m => m.amount < 0).map(b => ({member: b.member, amount: b.amount * -1}));
    return {lenders, borrowers};
}

// Calculate the transactions necessary to settle the debts (see README.md for explanation of the algorithm)
function calculateTransactions(borrowers, lenders, includeNestedDetails) {
    let transactions = [];

    let lenderIndex = 0;
    for (borrower of borrowers) {
        while (lenderIndex < lenders.length && lenders[lenderIndex].amount <= borrower.amount) {
            transactions.push(
                getTransactionObject(borrower, lenders[lenderIndex], lenders[lenderIndex].amount, includeNestedDetails));
            borrower.amount -= lenders[lenderIndex].amount;
            lenderIndex++;
        }
        if (borrower.amount !== 0 && lenderIndex < lenders.length) {
            transactions.push(getTransactionObject(borrower, lenders[lenderIndex], borrower.amount, includeNestedDetails));
            lenders[lenderIndex].amount -= borrower.amount;
        }
    }
    return transactions;
}

function getTransactionObject(borrower, lender, amount, includeNestedDetails) {
    if(includeNestedDetails) {
        return {
            source: {_id: borrower.member._id, name: borrower.member.name, email: borrower.member.email},
            target: {_id: lender.member._id, name: lender.member.name, email: lender.member.email},
            amount: amount
        };
    }
    else {
        return {
            source: borrower.member._id,
            target: lender.member._id,
            amount: amount
        };
    }
}

function getAll(includeNestedDetails, req, res) {
    res.setHeader('Content-Type', 'application/json');

    let groupMembers;

    GroupMember.find({groupEventId: req.params.groupEventId})
        // Find all group members in the group event
        .then(_groupMembers => {
          groupMembers = _groupMembers;
          return Expense.find({groupEventId: req.params.groupEventId});
        })
        // Find all expenses in the group event and calculate the transactions
        .then(expenses => {
          // Create a map from group members to their dues
          let groupMemberDues = calculateGroupMemberDues(groupMembers, expenses);

          // Split into owing and advancing group members
          let {lenders, borrowers} = calculateLendersBorrowers(groupMemberDues);

          // Calculate a list of transactions
          let transactions = calculateTransactions(borrowers, lenders, includeNestedDetails);
          res.send(transactions);
        })
        .catch(err => respondToError(res, err));
}

router.getAllNested = (req, res) => {
    return getAll(true, req, res);
};

router.getAllReferenced = (req, res) => {
    return getAll(false, req, res);
};

module.exports = router;
