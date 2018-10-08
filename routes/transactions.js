// TODO consistent tabs/spaces
let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers')
let Expense = require('../models/expenses');

router.getAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let groupMembers = null;
  // TODO Make sure the group event exists
  // Find all GroupMembers in the group event
  GroupMember.find({groupEventId: req.params.groupEventId})
      .then(_groupMembers => {
          groupMembers = _groupMembers;
          return Expense.find({groupEventId: req.params.groupEventId});
      })
      .then(expenses => {
          // Create a map from group members to their dues
          let groupMemberDues = {};
          for (member of groupMembers) {
              groupMemberDues[member._id] = 0; // TODO correctly calculating with decimals?
          }
          for (expense of expenses) {
              expenseSharingMembers = expense.sharingGroupMembers.length > 0 ? expense.sharingGroupMembers // TODO necessary?
                  : groupMembers.map(m => m._id);
              let amount = Number(expense.amount);
              for (member of expenseSharingMembers) {
                  groupMemberDues[member] -= amount / expenseSharingMembers.length;
              }
              groupMemberDues[expense.payingGroupMember] += amount;
          }

          // Split into owing and advancing group members
          let groupMemberDuesArray = Object.keys(groupMemberDues).map(k => {return {id: k, amount: groupMemberDues[k]};});
          let lenders = groupMemberDuesArray.filter(m => m.amount > 0);
          let borrowers = groupMemberDuesArray.filter(m => m.amount < 0).map(b => {b.amount *= -1; return b;});
          console.log(borrowers, lenders);
          let transactions = [];

          let lenderIndex = 0;
          for (borrower of borrowers) {
              while (lenderIndex < lenders.length && lenders[lenderIndex].amount <= borrower.amount) {
                  transactions.push({source: borrower.id, target: lenders[lenderIndex].id, amount: lenders[lenderIndex].amount});
                  borrower.amount -= lenders[lenderIndex].amount;
                  lenderIndex++;
              }
              if (borrower.amount !== 0 && lenderIndex < lenders.length) {
                  transactions.push({source: borrower.id, target: lenders[lenderIndex].id, amount: borrower.amount});
                  lenders[lenderIndex].amount -= borrower.amount;
              }
          }
          console.log("done");
          //let givingIndex = groupMemberDues
          // ...
          res.send(transactions);
      })
      .catch(err => res.send(err));
};

module.exports = router;