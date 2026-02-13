const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    department: {
        type: String
    },
    location: {
        type: String,
        default: 'Remote'
    },
    duration: {
        type: String
    },
    stipend: String,
    requirements: [String],
    responsibilities: [String],
    slots: {
        type: Number,
        default: 1
    },
    filledSlots: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'upcoming'],
        default: 'open'
    },
    startDate: Date,
    deadline: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Internship', internshipSchema);
