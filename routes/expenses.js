let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers')
let Expense = require('../models/expenses');

// TODO connect only once
let mongodbUri = require('../models/mongodbUri');
mongoose.connect(mongodbUri);
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('expenses: Successfully connected to [' + db.name + ']');
});


router.getAll = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  Expense.find({'groupEventId': req.params.groupEventId}, (err, expenses) => {
      if(err)
          res.send(err);
      else
          res.send(expenses);
  });
};

router.getOne = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  Expense.findOne({'groupEventId': req.params.groupEventId, '_id': req.params.id}, (err, expense) => {
     if(err)
         res.send(err);
     else
         res.send(expense);
  });
};

router.addExpense = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // TODO validate data/error handling
  let expense = new Expense();

  // TODO does not actually ensure that a group event exists!
  // TODO probably pretty broken/Callback hell
  GroupEvent.findById(req.params.groupEventId, (err, groupEvent) => {
        if(err || !groupEvent)
            res.send(err); // TODO
        else {
            // TODO does not actually ensure that a group member exists!
            GroupMember.findById(req.body.payingGroupMember, (err, groupMember) => {
                if(err || !groupMember)
                    res.send(err); // TODO
                else {
                    GroupMember.find({_id: {$in: req.body.sharingGroupMembers}}, (err, sharingGroupMembers) => {
                        if(err)
                            res.send(err);
                        if(req.body.sharingGroupMembers && sharingGroupMembers.length !== req.body.sharingGroupMembers.length)
                            res.send("Error!"); // TODO
                        else {
                            expense.groupEventId = req.params.groupEventId;
                            expense.payingGroupMember = req.body.payingGroupMember;
                            expense.amount = req.body.amount;
                            expense.date = req.body.date;
                            expense.description = req.body.description;
                            expense.sharingGroupMembers = req.body.sharingGroupMembers;

                            // TODO update balance? groupMember.summedBalance

                            expense.save(err => {
                                if (err)
                                    res.send({message: 'Expense not added!', errmsg: err});
                                else
                                    res.send({message: 'Expense added successfully', data: expense});
                            });
                        }
                    });
                }
            });
        }
  });
};

module.exports = router;