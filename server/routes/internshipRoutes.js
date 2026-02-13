const express = require('express');
const {
    getInternships,
    getInternship,
    createInternship,
    updateInternship,
    deleteInternship
} = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
    .route('/')
    .get(getInternships)
    .post(protect, authorize('admin', 'mentor'), createInternship);

router
    .route('/:id')
    .get(getInternship)
    .put(protect, authorize('admin', 'mentor'), updateInternship)
    .delete(protect, authorize('admin', 'mentor'), deleteInternship);

module.exports = router;
