const DailyLog = require('../models/DailyLog');

// @desc    Get all daily logs
// @route   GET /api/daily-logs
// @access  Private
exports.getDailyLogs = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'intern') {
            query = DailyLog.find({ userId: req.user.id });
        } else {
            // Mentors/Admins might want to see all or filter by user
            // For now return all, in real app would filter
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

        if (dailyLog.userId.toString() !== req.user.id && req.user.role === 'intern') {
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
