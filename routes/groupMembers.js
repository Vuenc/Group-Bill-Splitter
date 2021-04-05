let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');

let respondToError = require('../lib/helpers').respondToError;

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find all group members and send them
    GroupMember.find({groupEventId: req.params.groupEventId})
        .then(groupMember => res.send(groupMember))
        // If the group event doesn't exist or any other error occurs, send error message
        .catch(err => respondToError(res, err));

};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find group member and send it
    GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId})
        .then(groupMember => {
            if(groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!", http_status: 404};

            res.send(groupMember[0])
        })
        // If the group event or group member don't exist or any other error occurs, send error message
        .catch(err => respondToError(res, err));
};

router.addGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Create a group member and save it
    let groupMember = new GroupMember(req.body);
    groupMember.groupEventId = req.params.groupEventId;
    groupMember.save()
        // If the group member was saved successfully, send a success message
        .then(groupMember => {
            res.send({message: 'Group member added successfully', data: groupMember});
        })
        // If the group event doesn't exist or saving failed, send error message
        .catch(err => respondToError(res, err, 'Group member not added!'));
};

router.editGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group member, update and save it
    GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId})
        .then(groupMember => {
            if(groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!", http_status: 404};
            groupMember = groupMember[0];

            groupMember.name = req.body.name;
            groupMember.email = req.body.email;

            return groupMember.save();
        })
        // If the group member was saved successfully, send a success message
        .then(groupMember => res.send({message: 'Group member edited successfully', data: groupMember}))
        // If the group event or group member don't exist or saving failed, send error message
        .catch(err => respondToError(res, err, 'Group member not edited!')); // TODO unify error messages*/
};

router.deleteGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let groupMember;

    // Check if the group member exists, and check if there are any expenses depending on this group member
    GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId})
        .then(_groupMember => {
            if(_groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!", http_status: 404};
            groupMember = _groupMember[0];

            // Use req.params.id instead of groupMember._id everywhere since in proportional splitting, id seems to be a string instead of ObjectId
            let isPayingGroupMemberQuery = {payingGroupMember: req.params.id}
            let isSharingGroupMemberQuery = {sharingGroupMembers: {$elemMatch: {$eq: req.params.id}}}
            // Also disallow occurences with percentage/amount 0 (server should avoid these anyway)
            let isInPercentageSplittingQuery =
              {'proportionalSplitting.percentages': { $elemMatch: { groupMember: req.params.id }}}
            let isInAmountSplittingQuery =
              {'proportionalSplitting.amounts': { $elemMatch: { groupMember: req.params.id}}}
            return Expense.countDocuments({$or: [isPayingGroupMemberQuery, isSharingGroupMemberQuery,
                isInPercentageSplittingQuery, isInAmountSplittingQuery]});
        })
        // If there are no dependent expenses, find the group member and delete it
        .then(dependentExpensesCount => {
            if(dependentExpensesCount > 0)
                throw {message: "Group member " + req.params.id + " can't be deleted because there are still dependent expenses!", http_status: 409};

            return groupMember.delete();
        })
        // If the group member was deleted successfully, send a success message
        .then(() => res.send({message: 'Group member deleted successfully'}))
        // If the group event or group member don't exist or deleting failed, send error message
        .catch(err => respondToError(res, err, 'Group member not deleted!'));
};

module.exports = router;
