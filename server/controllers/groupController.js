const mongoose = require('mongoose');
const Group = require('../models/Group');

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'intern') {
            query = Group.find({ memberIds: req.user.id });
        } else if (req.user.role === 'mentor') {
            // Mentors see groups they admin OR are in
            query = Group.find({ adminIds: req.user.id });
        } else {
            query = Group.find();
        }

        const groups = await query
            .populate('memberIds', 'name email')
            .populate('adminIds', 'name email');

        res.status(200).json({ success: true, count: groups.length, data: groups });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('memberIds', 'name email')
            .populate('adminIds', 'name email');

        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        res.status(200).json({ success: true, data: group });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private (Admin/Mentor)
exports.createGroup = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({ success: false, error: 'Group name is required' });
        }

        // Filter and validate IDs - ensure they are valid MongoDB ObjectIds
        const validMemberIds = (req.body.memberIds || [])
            .filter(id => id && typeof id === 'string' && id.trim())
            .filter(id => mongoose.Types.ObjectId.isValid(id));
            
        const validAdminIds = (req.body.adminIds || [])
            .filter(id => id && typeof id === 'string' && id.trim())
            .filter(id => mongoose.Types.ObjectId.isValid(id));

        // If mentor creates, auto-add as admin if not already present
        if (req.user.role === 'mentor' && !validAdminIds.includes(req.user.id)) {
            validAdminIds.push(req.user.id);
        }

        // Ensure at least one admin exists
        if (validAdminIds.length === 0) {
            validAdminIds.push(req.user.id);
        }

        req.body.name = req.body.name.trim();
        req.body.description = (req.body.description || '').trim();
        req.body.memberIds = validMemberIds;
        req.body.adminIds = validAdminIds;

        const group = await Group.create(req.body);

        res.status(201).json({ success: true, data: group });
    } catch (err) {
        console.error('Error creating group:', err);
        
        // Handle duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                error: `A group with this ${field} already exists` 
            });
        }
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                success: false, 
                error: messages.join(', ') 
            });
        }
        
        res.status(400).json({ success: false, error: err.message || 'Failed to create group' });
    }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (Admin/Mentor)
exports.updateGroup = async (req, res) => {
    try {
        let group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        group = await Group.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: group });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Admin/Mentor)
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        await group.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
