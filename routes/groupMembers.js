let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers');

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};
            return GroupMember.find({groupEventId: req.params.groupEventId});
        })
        .then(groupMember => res.send(groupMember))
        .catch(err => res.send(err));

};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return GroupMember.find({_id: req.params.id, groupEventId: req.params.groupEventId});
        })
        .then(groupMember => {
            if(groupMember.length === 0)
                throw {message: "Group member with id " + req.params.id + " not found!"};

            res.send(groupMember[0])
        })
        .catch(err => res.send(err)); // TODO send different response code
};

router.addGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO validate all necessary data present
    GroupEvent.find({_id: req.params.groupEventId})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            let groupMember = new GroupMember();
            groupMember.groupEventId = req.params.groupEventId;
            groupMember.name = req.body.name;
            groupMember.summedBalance = 0;
            return groupMember.save();
        })
        .then(groupMember => {
            res.send({message: 'Group member added successfully', data: groupMember});
        })
        .catch(err => res.send(err)); // TODO send different response code; unify message format
};

module.exports = router;