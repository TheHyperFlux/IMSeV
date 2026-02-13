const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    department: String,
    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed'],
        default: 'planning'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', projectSchema);
