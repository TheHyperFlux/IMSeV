const express = require('express');
const {
    getDailyLogs,
    createDailyLog,
    updateDailyLog,
    deleteDailyLog
} = require('../controllers/dailyLogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getDailyLogs)
    .post(createDailyLog);

router
    .route('/:id')
    .put(updateDailyLog)
    .delete(deleteDailyLog);

module.exports = router;
