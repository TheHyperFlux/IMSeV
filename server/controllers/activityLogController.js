const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs (Admin/Mentor)
// @route   GET /api/activity-logs
// @access  Private (Admin/Mentor)
const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(50); // Limit to last 50
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get logs for a specific user
// @route   GET /api/activity-logs/user/:userId
// @access  Private
const getUserActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find({ userId: req.params.userId })
            .sort({ timestamp: -1 })
            .limit(20);
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create an activity log
// @route   POST /api/activity-logs
// @access  Private
const createActivityLog = async (req, res) => {
    try {
        // Ensure userId is set to the authenticated user
        req.body.userId = req.user.id;
        
        const log = await ActivityLog.create(req.body);
        res.status(201).json({ success: true, data: log });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    getActivityLogs,
    getUserActivityLogs,
    createActivityLog,
};
