const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin/Mentor
exports.getUsers = async (req, res) => {
    try {
        // In a real app, you might want to paginate or filter
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create user (Admin function to add user directly)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        console.log('CREATE USER called:', req.body);
        const { name, email, password, role, department } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Create user
        console.log('Creating user in DB...');
        user = await User.create({
            name,
            email,
            password,
            role,
            department
        });
        console.log('User created! ID:', user._id);

        // Remove password from response
        user.password = undefined;

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
exports.updateUser = async (req, res) => {
    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check permissions: Admin can update anyone, User can only update self (and maybe not role)
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this user' });
        }

        // If password is being updated, it needs to be hashed (handled by pre-save hook in model if we were using save(), but findByIdAndUpdate doesn't run pre-save hooks easily without extra config or manual hashing)
        // Better to handle password update separately or manually hash here if passed.
        // For simplicity, we'll assume the model's pre-save isn't triggered by findByIdAndUpdate, so we hash manually if password is present.

        let updateData = { ...req.body };

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        // Prevent non-admins from changing roles
        if (req.user.role !== 'admin' && updateData.role && updateData.role !== user.role) {
            delete updateData.role;
        }

        user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).select('-password');

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        await user.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
