const express = require('express');
const {
    getChats,
    createChat,
    getMessages,
    sendMessage,
    deleteChatForUser
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/chats')
    .get(getChats)
    .post(createChat);

// allow marking a chat deleted for current user (soft-delete)
router.route('/chats/:id').delete(deleteChatForUser);

router.route('/messages/:chatId')
    .get(getMessages);

router.route('/messages')
    .post(sendMessage);

module.exports = router;
