const express = require('express');
const {
    getProjects,
    getProject,
    createProject,
    updateProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getProjects)
    .post(authorize('admin', 'mentor'), createProject);

router
    .route('/:id')
    .get(getProject)
    .put(authorize('admin', 'mentor'), updateProject);

module.exports = router;
