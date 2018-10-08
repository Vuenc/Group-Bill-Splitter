let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers')
let Expense = require('../models/expenses');

router.getAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return Expense.find({'groupEventId': req.params.groupEventId});
        })
        .then(expenses => res.send(expenses))
        .catch(err => res.send(err));
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return Expense.find({'groupEventId': req.params.groupEventId, '_id': req.params.id});
        })
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!"};

            res.send(expense[0]);
        })
        .catch(err => res.send(err));
};

router.addExpense = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  GroupEvent.find({_id: req.params.groupEventId})
      .then(groupEvent => {
          if (groupEvent.length === 0)
              throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

          return GroupMember.find({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId});
      })
      .then(payingGroupMember => {
          if (payingGroupMember.length === 0)
              throw {message: "Group member with id " + req.body.payingGroupMember + " not found!"};

          return GroupMember.find({_id: {$in: req.body.sharingGroupMembers}});
      })
      .then(sharingGroupMembers => {
          if (req.body.sharingGroupMembers && sharingGroupMembers.length !== req.body.sharingGroupMembers.length)
              throw {message: "Field sharingGroupMembers includes invalid entries"}; // TODO unify error messages

          // TODO validate data
          let expense = new Expense();
          expense.groupEventId = req.params.groupEventId;
          expense.payingGroupMember = req.body.payingGroupMember;
          expense.amount = req.body.amount;
          expense.date = req.body.date;
          expense.description = req.body.description;
          expense.sharingGroupMembers = req.body.sharingGroupMembers;

          // TODO update balance? groupMember.summedBalance

          return expense.save();
      })
      .then(expense => res.send({message: 'Expense added successfully', data: expense}))
      .catch(err => res.send({message: 'Expense not added!', errmsg: err})); // TODO unify error messages; status codes
};

module.exports = router;