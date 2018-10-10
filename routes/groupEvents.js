let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find()
        .then(groupEvents => res.send(groupEvents))
        .catch(err => res.send(err)); // TODO JSON.stringify?
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.id + " not found!"};

            res.send(groupEvent[0]);
        })
        .catch(err => res.send(err));  // TODO JSON.stringify?
};

router.addGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO validate all necessary data present
    Promise.resolve()
    .then(() => {
        let groupEvent = new GroupEvent();
        groupEvent.name = req.body.name;
        groupEvent.currencyPrefix = req.body.currencyPrefix;

        return groupEvent.save();
    })
    .then(groupEvent => res.send({message: 'Group event added successfully', data: groupEvent}))
    .catch(err => res.send({message: 'Group event not added!', errmsg: err})); // TODO unify error messages*/
};

router.editGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};
            groupEvent = groupEvent[0];

            groupEvent.name = req.body.name;
            groupEvent.currencyPrefix = req.body.currencyPrefix;

            return groupEvent.save();
        })
        .then(groupEvent => res.send({message: 'Group event edited successfully', data: groupEvent}))
        .catch(err => res.send({message: 'Group event not edited!', errmsg: err})); // TODO unify error messages*/
};

router.deleteGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return groupEvent[0].delete();
        })
        .then(() => res.send({message: 'Group event deleted successfully'}))
        .catch(err => res.send({message: 'Group event not deleted!', errmsg: err})); // TODO unify error messages*/
};

module.exports = router;