let express = require('express');
let router = express.Router();

require('../models/mongooseConnection');
let GroupMember = require('../models/groupMembers');
let Expense = require('../models/expenses');

let respondToError = require('../lib/helpers').respondToError;

// Sums what each group member's total share of the costs is
function calculateGroupMemberCosts(groupMembers, expenses) {
    // groupMemberCosts is a dictionary where the costs are calculated
    let groupMemberCosts = {};
    // Initialize groupMemberCosts
    for (member of groupMembers) {
        groupMemberCosts[member._id] = {member: member, amount: 0};
    }

    // Split each expense to the group members who share it
    for (expense of expenses) {
        // Get the members who share the expense ([] is interpreted as everybody in the group)
        let expenseSharingMembers = expense.sharingGroupMembers.length > 0
            ? expense.sharingGroupMembers : groupMembers.map(m => m._id);
        let amount = Number(expense.amount);
        for (member of expenseSharingMembers) {
            // For every sharing group member: count their part as costs
            groupMemberCosts[member].amount += amount / expenseSharingMembers.length;
        }
    }
    return groupMemberCosts;
}

// Get costs for all group members of the event
router.getAll = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    let groupMembers;

    GroupMember.find({groupEventId: req.params.groupEventId})
        // Find all group members in the group event
        .then(_groupMembers => {
            groupMembers = _groupMembers;
            return Expense.find({groupEventId: req.params.groupEventId, isDirectPayment: {$ne: true}});
        })
        // Find all expenses in the group event and calculate the costs
        .then(expenses => {
            // Create a map from group members to their costs
            let groupMemberCosts = calculateGroupMemberCosts(groupMembers, expenses);
            res.send(groupMemberCosts);
        })
        .catch(err => respondToError(res, err));
};

module.exports = router;
