let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

let GroupEvent = require('../models/groupEvents');
let GroupMember = require('../models/groupMembers');

// TODO connect only once
let mongodbUri = require('../models/mongodbUri');
mongoose.connect(mongodbUri);
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('groupMembers: Successfully connected to [' + db.name + ']');
});


router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO make sure group event exists?
    GroupMember.find({groupEventId: req.params.groupEventId}, (err, groupMembers) => {
        if(err)
            res.send(err);
        else
            res.send(groupMembers); // TODO JSON.stringify?
    })
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO make sure group event exists?
    // TODO error handling
    GroupMember.findOne({_id: req.params.id, groupEventId: req.params.groupEventId}, (err, groupMember) => {
        if(err)
            res.send(err);
        else
            res.send(groupMember); // TODO JSON.stringify?
    })
};

router.addGroupMember = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO does not actually ensure that a group event exists!
    GroupEvent.findById(req.params.groupEventId, (err, groupEvent) => {
        if(err)
            res.send(err);
        else {
            let groupMember = new GroupMember();
            groupMember.groupEventId = req.params.groupEventId;
            groupMember.name = req.body.name;
            groupMember.summedBalance = 0;
            groupMember.save(err => {
                if(err)
                    res.send({message: 'Group member not added!', errmsg: err});
                else
                    res.send({message: 'Group member added successfully', data: groupMember});
            });
        }
    });
};

module.exports = router;