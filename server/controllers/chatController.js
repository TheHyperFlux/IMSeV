const Chat = require('../models/Chat');
const Message = require('../models/Message');

// --- CHATS ---

// @desc    Get user chats
// @route   GET /api/chats
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participantIds: req.user.id })
            .populate('participantIds', 'name avatar')
            .populate('groupId', 'name')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: chats.length, data: chats });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create chat (or get existing direct chat)
// @route   POST /api/chats
exports.createChat = async (req, res) => {
    try {
        const { participantIds, type, name, groupId } = req.body;

        // Ensure current user is in participants
        if (!participantIds.includes(req.user.id)) {
            participantIds.push(req.user.id);
        }

        // Check for existing direct chat
        if (type === 'direct' && participantIds.length === 2) {
            const existingChat = await Chat.findOne({
                type: 'direct',
                participantIds: { $all: participantIds, $size: 2 }
            });
            if (existingChat) {
                return res.status(200).json({ success: true, data: existingChat });
            }
        }

        const chat = await Chat.create({
            type,
            name,
            participantIds,
            groupId
        });

        const populatedChat = await Chat.findById(chat._id).populate('participantIds', 'name avatar');

        res.status(201).json({ success: true, data: populatedChat });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// --- MESSAGES ---

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('senderId', 'name avatar')
            .sort({ timestamp: 1 });

        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Send message
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;

        const message = await Message.create({
            chatId,
            senderId: req.user.id,
            content
        });

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: content,
            lastMessageAt: Date.now()
        });

        const populatedMessage = await Message.findById(message._id).populate('senderId', 'name avatar');

        res.status(201).json({ success: true, data: populatedMessage });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
