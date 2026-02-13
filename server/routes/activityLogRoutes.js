const express = require('express');
const router = express.Router();
const {
    getActivityLogs,
    getUserActivityLogs,
    createActivityLog,
} = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'mentor'), getActivityLogs)
    .post(protect, createActivityLog);

router.route('/user/:userId')
    .get(protect, getUserActivityLogs);

module.exports = router;
