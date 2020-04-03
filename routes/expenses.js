let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');
let escape_regex = require ('escape-string-regexp');

let respondToError = require('../lib/helpers').respondToError;

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
            queryList = []

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
                let datePredicate = {}
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

    // Make sure the paying group member exists
    GroupMember.find({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId})
        .then(payingGroupMember => {
            if (payingGroupMember.length === 0)
                throw {message: "Group member with id " + req.body.payingGroupMember + " not found!", http_status: 404};

            return GroupMember.find({_id: {$in: req.body.sharingGroupMembers}});
        })
        // Make sure the sharing group members exist and have no duplicates, then add the expense
        .then(sharingGroupMembers => {
            if (req.body.sharingGroupMembers && sharingGroupMembers.length !== req.body.sharingGroupMembers.length)
                throw {message: "Field sharingGroupMembers includes invalid entries", http_status: 422};

            let expense = new Expense(req.body);
            expense.groupEventId = req.params.groupEventId;

            return expense.save();
        })
        // If the expense was saved successfully, send a success message
        .then(expense => res.send({message: 'Expense added successfully', data: expense}))
        // If any of the checks failed or any other error occurred, send the error message
        .catch(err => respondToError(res, err, 'Expense not added!'));
};

router.editExpense = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupMember.countDocuments({_id: req.body.payingGroupMember, groupEventId: req.params.groupEventId})
        .then(payingGroupMemberCount => {
            if (payingGroupMemberCount === 0)
                throw {message: "Group member with id " + req.body.payingGroupMember + " not found!", http_status: 404};

            return GroupMember.countDocuments({_id: {$in: req.body.sharingGroupMembers}});
        })
        // Make sure the sharing group members exist and have no duplicates
        .then(sharingGroupMembersCount => {
            if (req.body.sharingGroupMembers && sharingGroupMembersCount !== req.body.sharingGroupMembers.length)
                throw {message: "Field sharingGroupMembers includes invalid entries", http_status: 422};

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

module.exports = router;
