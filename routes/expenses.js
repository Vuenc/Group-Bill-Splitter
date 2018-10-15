let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers')
let Expense = require('../models/expenses');

router.getAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return Expense.find({'groupEventId': req.params.groupEventId});
        })
        // Find all expenses and send them
        .then(expenses => res.send(expenses))
        // If the group event doesn't exist or some other error occured, send the error
        .catch(err => res.send(err));
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return Expense.find({'groupEventId': req.params.groupEventId, '_id': req.params.id});
        })
        // Find the expense and send it
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!"};

            res.send(expense[0]);
        })
        // If the group event or expense don't exist or some other error occured, send the error
        .catch(err => res.send(err));
};

router.addExpense = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
          if (groupEvent.length === 0)
              throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

          return GroupMember.find({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId});
        })
        // Make sure the paying group member exists
        .then(payingGroupMember => {
          if (payingGroupMember.length === 0)
              throw {message: "Group member with id " + req.body.payingGroupMember + " not found!"};

          return GroupMember.find({_id: {$in: req.body.sharingGroupMembers}});
        })
        // Make sure the sharing group members exist and have no duplicates, then add the expense
        .then(sharingGroupMembers => {
          if (req.body.sharingGroupMembers && sharingGroupMembers.length !== req.body.sharingGroupMembers.length)
              throw {message: "Field sharingGroupMembers includes invalid entries"}; // TODO unify error messages

          // TODO validate data
          let expense = new Expense(req.body);
          expense.groupEventId = req.params.groupEventId;
          /*
          expense.payingGroupMember = req.body.payingGroupMember;
          expense.amount = req.body.amount;
          expense.date = req.body.date;
          expense.description = req.body.description;
          expense.sharingGroupMembers = req.body.sharingGroupMembers;
          */
          return expense.save();
        })
        // If the expense was saved successfully, send a success message
        .then(expense => res.send({message: 'Expense added successfully', data: expense}))  // TODO default doesn't work here!
        // If any of the checks failed or any other error occured, send the error message
        .catch(err => res.send({message: 'Expense not added!', errmsg: err})); // TODO unify error messages; status codes
};

router.editExpense = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return GroupMember.find({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId});
        })
        // Make sure the paying group member exists
        .then(payingGroupMember => {
            if (payingGroupMember.length === 0)
                throw {message: "Group member with id " + req.body.payingGroupMember + " not found!"};

            return GroupMember.find({_id: {$in: req.body.sharingGroupMembers}});
        })
        // Make sure the sharing group members exist and have no duplicates
        .then(sharingGroupMembers => {
            if (req.body.sharingGroupMembers && sharingGroupMembers.length !== req.body.sharingGroupMembers.length)
                throw {message: "Field sharingGroupMembers includes invalid entries"}; // TODO unify error messages

            return Expense.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Find the expense and edit it
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!"};
            expense = expense[0];

            // TODO inconsistent with/more complicated than add code
            expense.payingGroupMember = req.body.payingGroupMember;
            expense.amount = req.body.amount;
            expense.date = req.body.date;
            expense.description = req.body.description;
            expense.sharingGroupMembers = req.body.sharingGroupMembers;

            return expense.save();
        })
        // If the expense was saved successfully, send a success message
        .then(expense => res.send({message: 'Expense edited successfully', data: expense}))
        // If any of the checks failed or any other error occured, send the error message
        .catch(err => res.send({message: 'Expense not edited!', errmsg: err})); // TODO unify error messages; status codes
};

router.deleteExpense = (req, res) =>  {
    // TODO ensure consistency!
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return Expense.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Find the expense and delete it
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!"};

            return expense[0].delete();
        })
        // If the expense was deleted successfully, send a success message
        .then(expense => res.send({message: 'Expense deleted successfully', data: expense}))
        // If the group event doesn't exist or deleting the expense failed, send error message
        .catch(err => res.send({message: 'Expense not deleted!', errmsg: err})); // TODO unify error messages; status codes
};

module.exports = router;