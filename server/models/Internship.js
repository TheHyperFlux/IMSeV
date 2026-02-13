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
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    department: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: 'Remote'
    },
    duration: {
        type: String,
        required: true
    },
    stipend: String,
    requirements: [String],
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
    deadline: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Internship', internshipSchema);
