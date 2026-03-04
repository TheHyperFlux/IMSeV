const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');

const toObjectId = (id) => {
    if (!id) return undefined;
    if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
    return undefined;
};

// @desc    Get all daily logs
// @route   GET /api/daily-logs
// @access  Private
exports.getDailyLogs = async (req, res) => {
    try {
        let query;

        const userIdStr = req.user.id || (req.user._id && req.user._id.toString());
        const userObjectId = toObjectId(userIdStr);

        if (req.user.role === 'intern') {
            // Interns can only see their own logs
            const conditions = [];
            if (userIdStr) conditions.push({ userId: userIdStr });
            if (userObjectId) conditions.push({ userId: userObjectId });
            query = DailyLog.find(conditions.length ? { $or: conditions } : { _id: null });
        } else if (req.user.role === 'mentor') {
            // Mentors can only see logs explicitly shared with them or logs they created themselves
            const orConditions = [];
            if (userIdStr) {
                orConditions.push({ sharedWith: userIdStr });
                orConditions.push({ userId: userIdStr });
            }
            if (userObjectId) {
                orConditions.push({ sharedWith: userObjectId });
                orConditions.push({ userId: userObjectId });
            }
            query = DailyLog.find(orConditions.length ? { $or: orConditions } : { _id: null });
        } else {
            // Admin can see all logs
            query = DailyLog.find();
        }

        // Sort by newest
        const dailyLogs = await query.sort({ date: -1 }).populate('userId', 'name');

        res.status(200).json({ success: true, count: dailyLogs.length, data: dailyLogs });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new daily log
// @route   POST /api/daily-logs
// @access  Private
exports.createDailyLog = async (req, res) => {
    try {
        // Always set owner as current user (intern)
        req.body.userId = req.user.id;

        const dailyLog = await DailyLog.create(req.body);

        res.status(201).json({ success: true, data: dailyLog });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update daily log
// @route   PUT /api/daily-logs/:id
// @access  Private
exports.updateDailyLog = async (req, res) => {
    try {
        let dailyLog = await DailyLog.findById(req.params.id);

        if (!dailyLog) {
            return res.status(404).json({ success: false, error: 'Log not found' });
        }

        // Interns can only modify their own logs
        if (req.user.role === 'intern' && dailyLog.userId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        dailyLog = await DailyLog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: dailyLog });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete daily log
// @route   DELETE /api/daily-logs/:id
// @access  Private
exports.deleteDailyLog = async (req, res) => {
    try {
        const dailyLog = await DailyLog.findById(req.params.id);

        if (!dailyLog) {
            return res.status(404).json({ success: false, error: 'Log not found' });
        }

        // Only the owner of the log or an admin can delete it
        const isOwner = dailyLog.userId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        await dailyLog.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
