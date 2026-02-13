const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes

router
    .route('/')
    .get(getUsers) // Allow all authenticated users to see users list (filtered by frontend/business logic)? Or restrict? Existing frontend logic suggests accessible.
    .post(authorize('admin'), createUser);

router
    .route('/:id')
    .get(getUser)
    .put(updateUser) // Auth check inside controller for self/admin
    .delete(authorize('admin'), deleteUser);

module.exports = router;
