let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find all group events and send them
    GroupEvent.find()
        .then(groupEvents => res.send(groupEvents))
        // If any error occured, send the error
        .catch(err => res.send(err)); // TODO JSON.stringify?
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group event and send it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.id + " not found!"};

            res.send(groupEvent[0]);
        })
        // If the group event doesn't exist or any other eror occured, send the error
        .catch(err => res.send(err));  // TODO JSON.stringify?
};

router.addGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO promise chain still necessary?
    Promise.resolve() // Start off promise chain, in order to handle all errors in .catch(...)
    .then(() => {
        let groupEvent = new GroupEvent(req.body);

        /*
        groupEvent.name = req.body.name;
        groupEvent.currencyPrefix = req.body.currencyPrefix;
        */

        return groupEvent.save();
    })
    // If the group event was saved successfully, send a success message
    .then(groupEvent => res.send({message: 'Group event added successfully', data: groupEvent}))
    // If the group event could not be saved, send the error
    .catch(err => res.send({message: 'Group event not added!', errmsg: err})); // TODO unify error messages*/
};

router.editGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group event, edit it and save it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};
            groupEvent = groupEvent[0];

            groupEvent.name = req.body.name;
            groupEvent.currencyPrefix = req.body.currencyPrefix;

            return groupEvent.save();
        })
        // If the group event was saved successfully, send a success message
        .then(groupEvent => res.send({message: 'Group event edited successfully', data: groupEvent}))
        // If the group event could not be saved, send the error
        .catch(err => res.send({message: 'Group event not edited!', errmsg: err})); // TODO unify error messages*/
};

router.deleteGroupEvent = (req, res) => {
    // TODO ensure consistency (delete all contents)
    res.setHeader('Content-Type', 'application/json');

    // Find the group event and delete it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!"};

            return groupEvent[0].delete();
        })
        // If the group event was deleted successfully, send a success message
        .then(() => res.send({message: 'Group event deleted successfully'}))
        // If deleting the group event failed, send error message
        .catch(err => res.send({message: 'Group event not deleted!', errmsg: err})); // TODO unify error messages*/
};

module.exports = router;