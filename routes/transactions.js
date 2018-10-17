// TODO consistent tabs/spaces
let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers')
let Expense = require('../models/expenses');

function calculateGroupMemberDues(groupMembers, expenses) {
    let groupMemberDues = {};
    for (member of groupMembers) {
        groupMemberDues[member._id] = 0; // TODO correctly calculating with decimals?
    }
    for (expense of expenses) {
        let expenseSharingMembers = expense.sharingGroupMembers.length > 0 ? expense.sharingGroupMembers // TODO necessary?
            : groupMembers.map(m => m._id);
        let amount = Number(expense.amount);
        for (member of expenseSharingMembers) {
            groupMemberDues[member] -= amount / expenseSharingMembers.length;
        }
        groupMemberDues[expense.payingGroupMember] += amount;
    }
    return groupMemberDues;
}

function calculateLendersBorrowers(groupMemberDues) {
    let groupMemberDuesArray = Object.keys(groupMemberDues).map(k => ({id: k, amount: groupMemberDues[k]}));
    let lenders = groupMemberDuesArray.filter(m => m.amount > 0);
    let borrowers = groupMemberDuesArray.filter(m => m.amount < 0).map(b => ({id: b.k, amount: b.amount * -1}));
    return {lenders, borrowers};
}

function calculateTransactions(borrowers, lenders) {
    let transactions = [];

    let lenderIndex = 0;
    for (borrower of borrowers) {
        while (lenderIndex < lenders.length && lenders[lenderIndex].amount <= borrower.amount) {
            transactions.push({
                source: borrower.id,
                target: lenders[lenderIndex].id,
                amount: lenders[lenderIndex].amount
            });
            borrower.amount -= lenders[lenderIndex].amount;
            lenderIndex++;
        }
        if (borrower.amount !== 0 && lenderIndex < lenders.length) {
            transactions.push({source: borrower.id, target: lenders[lenderIndex].id, amount: borrower.amount});
            lenders[lenderIndex].amount -= borrower.amount;
        }
    }
    return transactions;
}

router.getAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let groupMembers = null;

  // Make sure the group event exists
  GroupEvent.find({_id: req.params.groupEventId})
      .then(groupEvent => {
          if(groupEvent.length === 0)
              throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

          return GroupMember.find({groupEventId: req.params.groupEventId});
      })
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
          let transactions = calculateTransactions(borrowers, lenders);
          res.send(transactions);
      })
      .catch(err => respondToError(res, err));
};

module.exports = router;