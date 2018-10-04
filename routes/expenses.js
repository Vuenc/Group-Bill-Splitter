let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

let Expense = require('../models/expenses');

let mongodbUri = require('../models/mongodbUri');
mongoose.connect(mongodbUri);
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('Successfully connected to [' + db.name + ']');
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

  Expense.find({'groupEventId': req.params.groupEventId, '_id': req.params.id}, (err, expense) => {
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
  expense.groupEventId = req.params.groupEventId;
  // TODO expense.name = req.body.name
  expense.amount = req.body.amount;
  expense.payingGroupMember = req.body.payingGroupMember; // TODO pass by name or by id?
  expense.date = req.body.date;
  expense.description = req.body.description;
  expense.sharingGroupMembers = req.body.sharingGroupMembers;

  expense.save(err => {
      if(err)
          res.send({message: 'Expense not added!', errmsg: err});
      else
          res.send({message: 'Expense added successfully', data: expense});
  });
};

module.exports = router;