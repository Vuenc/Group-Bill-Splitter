let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');
let escape_regex = require ('escape-string-regexp');

let respondToError = require('../lib/helpers').respondToError;
let isNearlyEqual = require('../lib/helpers').isNearlyEqual;

function caseInsensitiveEscapedRegex(searchString) {
    return new RegExp(escape_regex(searchString.toLowerCase()), "i")
}

// Gets all expenses (that, if included, match certain search queries)
function getAll(includeNestedDetails, req, res) {
    res.setHeader('Content-Type', 'application/json');

    let findMemberNamesQuery = Promise.resolve();

    let query = req.query;

    // Find the ids of group members that match the given search string
    if(query.memberNameSearch) {
        // Escape the search string of security resaons to avoid Regex DoS attack
        findMemberNamesQuery = GroupMember.find({'groupEventId': req.params.groupEventId,
            'name': {$regex: caseInsensitiveEscapedRegex(query.memberNameSearch)}}, 'name')
    }

    // Execute the findMemberQuery, then construct the expense search query
    findMemberNamesQuery
        .then(searchedGroupMemberIds => {
            // Construct the basic query predicate (will be extended if search parameters were provided)
            let queryPredicate = {'groupEventId': req.params.groupEventId};

            // List of search queries which will either be connected by $and or by $or
            queryList = [];

            // If 'memberNameSearch' is provided, search only for expenses where the payingGroupMember's or any of the
            // explicitly mentioned sharingGroupMembers' names contain the search string
            if(query.memberNameSearch) {
                queryList.push({'$or': [
                    {'payingGroupMember': {$in: searchedGroupMemberIds}},
                    {'sharingGroupMembers': {$elemMatch: {$in: searchedGroupMemberIds}}}
                ]});
            }
            // If 'descriptionSearch' is provided, search only for expenses with descriptions containing the search string
            if(query.descriptionSearch) {
                // Escape the search string of security resaons to avoid Regex DoS attack
                queryList.push({'description': {$regex: caseInsensitiveEscapedRegex(query.descriptionSearch)}})
            }
            // If 'minDate' or 'maxDate' is provided, search only for expenses within that date range
            if(query.minDate || query.maxDate) {
                let datePredicate = {};
                if(query.minDate) {
                    datePredicate['$gte'] = query.minDate;
                }
                if(query.maxDate) {
                    datePredicate['$lte'] = query.maxDate;
                }
                queryPredicate['date'] = datePredicate
            }

            if(queryList.length > 0) {
                if(query.or === 'true') {
                    queryPredicate['$or'] = queryList
                } else {
                    queryPredicate['$and'] = queryList
                }
            }

            // Create 'find' query with optional nested details of group members
            let findQuery = Expense.find(queryPredicate);
            if(includeNestedDetails) {
                return findQuery
                    .populate('payingGroupMember', 'name email _id')
                    .populate('sharingGroupMembers', 'name email _id');
            }
            else {
                return findQuery;
            }
        })
        // Find all expenses and send them
        .then(expenses => res.send(expenses))
        // If the group event doesn't exist or some other error occurred, send the error
        .catch(err => respondToError(res, err));
}

function getOne(includeNestedDetails, req, res) {
    res.setHeader('Content-Type', 'application/json');

    // Create 'find' query with optional nested details of group members
    let findQuery = Expense.find({'groupEventId': req.params.groupEventId, '_id': req.params.id});
    if(includeNestedDetails) {
        findQuery.populate('payingGroupMember', 'name email _id')
            .populate('sharingGroupMembers', 'name email _id');
    }

    // Find the expense and send it
    findQuery
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!", http_status: 404};

            res.send(expense[0]);
        })
        // If the group event or expense don't exist or some other error occurred, send the error
        .catch(err => respondToError(res, err));
}

function checkExpenseValid (req, allowMissingFields = false) {
    // Make sure the paying group member exists (ignore if not present and missing fields allowed)
    let payingGroupMemberQuery = Promise.resolve(-1)
    if (!allowMissingFields || req.body.payingGroupMember) {
      payingGroupMemberQuery = GroupMember.countDocuments({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId})
    }

    // Return a promise that resolves if all checks are passed, and rejects otherwise
    return payingGroupMemberQuery
        .then(payingGroupMemberCount => {
            if (payingGroupMemberCount === 0)
                throw {message: "Group member with id " + req.body.payingGroupMember + " not found!", http_status: 404};

    // Check that no incompatible sharing/splitting options occur
            if (req.body.isDirectPayment && req.body.sharingGroupMembers && req.body.sharingGroupMembers.length > 1)
                throw { message: "Direct payment cannot be shared", http_status: 422 };
            if (req.body.isDirectPayment && req.body.proportionalSplitting)
                throw { message: "Direct payment cannot have proportional splitting", http_status: 422 };
            if (req.body.proportionalSplitting && req.body.sharingGroupMembers && req.body.sharingGroupMembers.length > 0)
                throw { message: "Expense cannot have both sharing group members and proportional splitting", http_status: 422 };

    // Make sure the sharing group members exist and have no duplicates (ignore if not present and missing fields allowed)
            if (!allowMissingFields || req.body.sharingGroupMembers) {
              return GroupMember.countDocuments({
                _id: {$in: req.body.sharingGroupMembers},
                groupEventId: req.params.groupEventId});
            } else {
              return Promise.resolve(-1);
            }
        })
        .then(sharingGroupMembersCount => {
            if (req.body.sharingGroupMembers && sharingGroupMembersCount !== req.body.sharingGroupMembers.length)
                throw {message: "Field sharingGroupMembers includes invalid entries", http_status: 422};

    // Make sure the splitting group members exist and have no duplicates and the splitting is valid
            let splitting = req.body.proportionalSplitting;
            if (splitting) {
                let proportionalSplittingGroupMembers;
                if (splitting.splitType === 'percentages') {
                    if (splitting.amounts || !splitting.percentages || !(splitting.percentages.length > 0)) {
                        throw { message: "Percentage splitting: percentages field required, amounts field not allowed", http_status: 422 };
                    }
                    let percentageValues = splitting.percentages.map(p => Number(p.percentage));
                    if (percentageValues.some(v => !(v >= 0))) {
                        throw {message: "Splitting percentages must not be negative"}
                    }
                    let sum = percentageValues.reduce((total, x) => total + x, 0);
                    if (!isNearlyEqual(sum, 1)) {
                        throw {message: "Splitting percentages must sum to 1"}
                    }
                    proportionalSplittingGroupMembers = splitting.percentages.map(p => p.groupMember)
                } else if (splitting.splitType === 'amounts') {
                    if (splitting.percentages || !splitting.amounts || !(splitting.amounts.length > 0)) {
                        throw {
                            message: "Amount splitting: amounts field required, percentages field not allowed",
                            http_status: 422
                        };
                    }
                    let amountValues = splitting.amounts.map(a => Number(a.amount));
                    if (amountValues.some(v => !(v >= 0))) {
                        throw {message: "Splitting amounts must not be negative"}
                    }
                    let sum = amountValues.reduce((total, x) => total + x, 0);
                    if (!isNearlyEqual(sum, Number.parseFloat(req.body.amount))) {
                        throw {message: "Splitting amounts must sum to expense amount"}
                    }
                    proportionalSplittingGroupMembers = splitting.amounts.map(p => p.groupMember)
                }
                return GroupMember.countDocuments({
                    _id: {$in: proportionalSplittingGroupMembers},
                    groupEventId: req.params.groupEventId
                });
            } else {
                return Promise.resolve()
            }
        })
        .then(splittingGroupMembersCount => {
            if (req.body.proportionalSplitting && splittingGroupMembersCount !== (req.body.proportionalSplitting.percentages
                ? req.body.proportionalSplitting.percentages : req.body.proportionalSplitting.amounts).length) {
                throw {
                    message: "Field proportionalSplitting contains invalid or duplicate group members",
                    http_status: 422
                }
            }
            return Promise.resolve()
        })
}

router.getAllNested = (req, res) => {
    return getAll(true, req, res);
};

router.getAllReferenced = (req, res) => {
    return getAll(false, req, res);
};

router.getOneNested = (req, res) => {
    return getOne(true, req, res);
};

router.getOneReferenced = (req, res) => {
    return getOne(false, req, res);
};

router.addExpense = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    checkExpenseValid(req)
        .then(() => {
            let expense = new Expense(req.body);
            expense.groupEventId = req.params.groupEventId;
            expense.schemaVersion = "3";

            return expense.save();
        })
        // If the expense was saved successfully, send a success message
        .then(expense => res.send({message: 'Expense added successfully', data: expense}))
        // If any of the checks failed or any other error occurred, send the error message
        .catch(err => respondToError(res, err, 'Expense not added!'));
};

router.editExpense = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    checkExpenseValid(req)
        .then(() => {
            return Expense.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Find the expense and edit it
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!", http_status: 404};
            expense = expense[0];

            expense.payingGroupMember = req.body.payingGroupMember;
            expense.amount = req.body.amount;
            expense.date = req.body.date;
            expense.description = req.body.description;
            expense.sharingGroupMembers = req.body.sharingGroupMembers;
            expense.isDirectPayment = req.body.isDirectPayment;
            expense.proportionalSplitting = req.body.proportionalSplitting;
            expense.schemaVersion = "3";

            return expense.save();
        })
        // If the expense was saved successfully, send a success message
        .then(expense => res.send({message: 'Expense edited successfully', data: expense}))
        // If any of the checks failed or any other error occurred, send the error message
        .catch(err => respondToError(res, err, 'Expense not edited!'));
};

router.deleteExpense = (req, res) =>  {
    res.setHeader('Content-Type', 'application/json');

    // Find the expense and delete it
    Expense.find({_id: req.params.id, groupEventId: req.params.groupEventId})
        .then(expense => {
            if (expense.length === 0)
                throw {message: "Expense with id " + req.params.id + " not found!", http_status: 404};

            return expense[0].delete();
        })
        // If the expense was deleted successfully, send a success message
        .then(expense => res.send({message: 'Expense deleted successfully', data: expense}))
        // If the group event doesn't exist or deleting the expense failed, send error message
        .catch(err => respondToError(res, err, 'Expense not deleted!'));
};

router.editMultipleExpenses = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // TODO make sure:
  // - direct payment => exactly one sharingGroupMember and no proportional splitting
  // - sharing group members (length > 0) + proportional splitting must not occur at once

  let countExpensesQuery = Expense.countDocuments({_id: {$in: req.body.expenseIds},
    groupEventId: req.params.groupEventId, $or: [{isDirectPayment: false}, {isDirectPayment: undefined}]});
  let countDirectPaymentsQuery = Expense.countDocuments({_id: {$in: req.body.expenseIds},
    groupEventId: req.params.groupEventId, isDirectPayment: true});

  let warning = null;
  Promise.all([countExpensesQuery, countDirectPaymentsQuery])
    .then(values => {
      let [expensesCount, directPaymentsCount] = values;

      // Make sure there is at least one expense/payment being updated
      if (expensesCount + directPaymentsCount === 0) {
        throw {message: 'No expense with matching id found', http_status: 422};
      }
      // If too few, but > 0 expenses/payments were found, return a warning, but continue with the update
      else if (expensesCount + directPaymentsCount < req.body.expenseIds.length) {
        warning = 'Some invalid expense ids were encountered (not all given ids existed)';
        console.log(`Warning: ${warning} when editing multiple expenses!`);
      }
      // Make sure to not mix expenses and direct payments
      if (expensesCount > 0 && directPaymentsCount > 0) {
        throw {message: 'Cannot edit both expenses and direct payments at the same time', http_status: 422};
      } else if (req.body.isDirectPayment !== undefined && ((directPaymentsCount > 0) ^ req.body.isDirectPayment)) {
        throw {message: 'Cannot change isDirectPayment in multi-edit', http_status: 422};
      }

      // Set isDirectPayment such that checks in checkExpenseValid can take it into account
      req.body.isDirectPayment = (directPaymentsCount > 0);
      return checkExpenseValid(req, true);
    })
    .then(() => {
      let updateFields = {
        payingGroupMember: req.body.payingGroupMember,
        amount: req.body.amount,
        date: req.body.date,
        description: req.body.description,
        sharingGroupMembers: req.body.sharingGroupMembers,
        isDirectPayment: req.body.isDirectPayment,
        proportionalSplitting: req.body.proportionalSplitting,
        schemaVersion: "3"
      };
      // Make sure `sharingGroupMembers` is set to [] if proportional splitting is active...
      if (updateFields.proportionalSplitting) {
        updateFields.sharingGroupMembers = [];
      }
      // ...and make sure `proportionalSplitting` is unset if `sharingGroupMembers` is set
      else if (updateFields.sharingGroupMembers) {
        updateFields.$unset = {proportionalSplitting: ""}
      }
      // Delete the undefined fields
      Object.keys(updateFields).forEach(key => updateFields[key] !== undefined || delete updateFields[key])
      return Expense.updateMany({_id: {$in: req.body.expenseIds}, groupEventId: req.params.groupEventId},
        updateFields);
    })
    // If the expense was saved successfully, send a success message
    .then(expense => res.send({message: 'Expenses edited successfully'}))
    // If any of the checks failed or any other error occurred, send the error message
    .catch(err => respondToError(res, err, 'Expenses not edited!'));
}

module.exports = router;
