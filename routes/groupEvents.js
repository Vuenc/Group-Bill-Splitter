let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

let GroupEvent = require('../models/groupEvents');

// TODO connect only once
let mongodbUri = require('../models/mongodbUri');
mongoose.connect(mongodbUri);
let db = mongoose.connection;

db.on('error', err => {
    console.log('Unable to connect to [' + db.name + ']', err);
});

db.once('open', () => {
    console.log('groupEvents: Successfully connected to [' + db.name + ']');
});


router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    GroupEvent.find((err, groupEvents) => {
        if(err)
            res.send(err);
        else
            res.send(groupEvents); // TODO JSON.stringify?
    })
};

router.getOne = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO error handling
    GroupEvent.findOne({_id: req.params.id}, (err, groupEvent) => {
        if(err)
            res.send(err);
        else
            res.send(groupEvent); // TODO JSON.stringify?
    })
};

router.addGroupEvent = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // TODO error handling
    let groupEvent = new GroupEvent();
    groupEvent.name = req.body.name;
    groupEvent.currencyPrefix = req.body.currencyPrefix;

    groupEvent.save(err => {
        if(err)
            res.send({message: 'Group event not added!', errmsg: err});
        else
            res.send({message: 'Group event added successfully', data: groupEvent});
    })
};

module.exports = router;