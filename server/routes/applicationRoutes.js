const express = require('express');
const {
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    acceptApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes protected

router
    .route('/')
    .get(getApplications)
    .post(createApplication);

router
    .route('/:id')
    .get(getApplication)
    .put(updateApplication);
router.route('/:id/accept').post(acceptApplication);

module.exports = router;
