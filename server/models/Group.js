const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: String,
    memberIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    adminIds: [{ // Mentors or Admins managing this group
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
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

module.exports = mongoose.model('Group', groupSchema);
