const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    name: String, // For group chats
    participantIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    lastMessage: String,
    lastMessageAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', chatSchema);
