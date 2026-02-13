const express = require('express');
const {
    getChats,
    createChat,
    getMessages,
    sendMessage
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/chats')
    .get(getChats)
    .post(createChat);

router.route('/messages/:chatId')
    .get(getMessages);

router.route('/messages')
    .post(sendMessage);

module.exports = router;
