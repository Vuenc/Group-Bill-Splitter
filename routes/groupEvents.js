let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupEvent = require('../models/groupEvents');

let respondToError = require('../lib/helpers').respondToError;

router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find all group events and send them
    GroupEvent.find()
        .then(groupEvents => res.send(groupEvents))
        // If any error occured, send the error
        .catch(err => respondToError(res, err));
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group event and send it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if(groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.id + " not found!", http_status: 404};

            res.send(groupEvent[0]);
        })
        // If the group event doesn't exist or any other eror occured, send the error
        .catch(err => respondToError(res, err));
};

router.addGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    let groupEvent = new GroupEvent(req.body);

    return groupEvent.save()
        // If the group event was saved successfully, send a success message
        .then(groupEvent => res.send({message: 'Group event added successfully', data: groupEvent}))
        // If the group event could not be saved, send the error
        .catch(err => respondToError(res, err, 'Group event not added!'));
};

router.editGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group event, edit it and save it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!", http_status: 404};
            groupEvent = groupEvent[0];

            groupEvent.name = req.body.name;
            groupEvent.currencyPrefix = req.body.currencyPrefix;

            return groupEvent.save();
        })
        // If the group event was saved successfully, send a success message
        .then(groupEvent => res.send({message: 'Group event edited successfully', data: groupEvent}))
        // If the group event could not be saved, send the error
        .catch(err => respondToError(res, err, 'Group event not edited!'));
};

// Consistency (deleting all contents) is ensured through a post hook in the GroupEvent model
router.deleteGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Find the group event and delete it
    GroupEvent.find({_id: req.params.id})
        .then(groupEvent => {
            if (groupEvent.length === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!", http_status: 404};

            return groupEvent[0].delete();
        })
        // If the group event was deleted successfully, send a success message
        .then(() => res.send({message: 'Group event deleted successfully'}))
        // If deleting the group event failed, send error message
        .catch(err => respondToError(res, err, 'Group event not deleted!'));
};

router.verifyExists = (req, res, next) => {
    GroupEvent.countDocuments({_id: req.params.groupEventId})
        .then(groupEventCount => {
            if (groupEventCount === 0)
                throw {message: "Group event with id " + req.params.groupEventId + " not found!", http_status: 404};
            next();
        })
        .catch(err => respondToError(res, err));
};

module.exports = router;