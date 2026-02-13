const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    tasksCompleted: String,
    tasksPlanned: String,
    challenges: String,
    learnings: String,
    hoursWorked: {
        type: Number,
        required: true
    },
    mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'struggling']
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending'
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

module.exports = mongoose.model('DailyLog', dailyLogSchema);
