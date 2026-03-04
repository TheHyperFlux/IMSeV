const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: String,
        status: {
            type: String,
            enum: ['todo', 'in_progress', 'in_review', 'completed'],
            default: 'todo'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        assigneeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        },
        dueDate: Date,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: Date
    },
    {
        // We perform our own validation in the controller;
        // disable built-in Mongoose validation to avoid strict requirements on projectId.
        validateBeforeSave: false
    }
);

module.exports = mongoose.model('Task', taskSchema);
