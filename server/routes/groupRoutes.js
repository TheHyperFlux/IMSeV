const express = require('express');
const {
    getGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup
} = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getGroups)
    .post(authorize('admin', 'mentor'), createGroup);

router
    .route('/:id')
    .get(getGroup)
    .put(authorize('admin', 'mentor'), updateGroup)
    .delete(authorize('admin', 'mentor'), deleteGroup);

module.exports = router;
