const express = require('express');
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getTasks)
    .post(authorize('admin', 'mentor'), createTask);

router
    .route('/:id')
    .put(updateTask)
    .delete(authorize('admin', 'mentor'), deleteTask);

module.exports = router;
