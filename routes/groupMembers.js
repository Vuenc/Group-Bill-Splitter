let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};
            return GroupMember.find({groupEventId: req.params.groupEventId});
        })
        // Find all group members and send them
        .then(groupMember => res.send(groupMember))
        // If the group event doesn't exist or any other error occurs, send error message
        .catch(err => res.send(err));

};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Find the group member and send it
        .then(groupMember => {
            if(groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!"};

            res.send(groupMember[0])
        })
        // If the group event or group member don't exist or any other error occurs, send error message
        .catch(err => res.send(err)); // TODO send different response code
};

router.addGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists, then add the group member
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            let groupMember = new GroupMember(req.body);
            groupMember.groupEventId = req.params.groupEventId;

            /* TODO
            groupMember.name = req.body.name;
            groupMember.summedBalance = 0;
            */

            return groupMember.save();
        })
        // If the group member was saved successfully, send a success message
        .then(groupMember => {
            res.send({message: 'Group member added successfully', data: groupMember});
        })
        // If the group event doesn't exist or saving failed, send error message
        .catch(err => res.send(err)); // TODO send different response code; unify message format
};

router.editGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Find the group member, update and save it
        .then(groupMember => {
            if(groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!"};
            groupMember = groupMember[0];

            groupMember.name = req.body.name;

            return groupMember.save();
        })
        // If the group member was saved successfully, send a success message
        .then(groupMember => res.send({message: 'Group member edited successfully', data: groupMember}))
        // If the group event or group member don't exist or saving failed, send error message
        .catch(err => res.send({message: 'Group member not edited!', errmsg: err})); // TODO unify error messages*/
};

router.deleteGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    let groupMember;
    // Make sure the group event exists
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        // Check if the group member exists, and check if there are any expenses depending on this group member
        .then(_groupMember => {
            if(_groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!"};
            groupMember = _groupMember[0];

            return Expense.countDocuments({$or: [{payingGroupMember: groupMember._id}, {sharingGroupMembers: {$elemMatch: {$eq: groupMember._id}}}]});
        })
        // If there are no dependent expenses, find the group member and delete it
        .then(count => {
            if(count > 0)
                throw {message: "Group member " + req.params.id + " can't be deleted because there are still dependent expenses!"};
            console.log(groupMember);

            return groupMember.delete();
        })
        // If the group member was deleted successfully, send a success message
        .then(() => res.send({message: 'Group member deleted successfully'}))
        // If the group event or group member don't exist or deleting failed, send error message
        .catch(err => res.send({message: 'Group member not deleted!', errmsg: err})); // TODO unify error messages*/
};

module.exports = router;