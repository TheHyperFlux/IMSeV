const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: String,
    resume: String, // URL to resume file
    coverLetter: String,
    skills: [String],
    education: String,
    experience: String,
    preferredDepartment: String,
    availableFrom: String,
    duration: String,
    status: {
        type: String,
        enum: ['pending', 'under_review', 'interviewed', 'accepted', 'rejected', 'on_hold'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    assignedGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }
});

module.exports = mongoose.model('Application', applicationSchema);
