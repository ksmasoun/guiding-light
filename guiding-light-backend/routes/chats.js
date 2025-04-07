const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const database = require('../database');

router.post('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const chatId = (database.chats[userId]?.length || 0) + 1;
  if (!database.chats[userId]) database.chats[userId] = [];
  database.chats[userId].push({ chatId, messages: [] });
  res.status(201).json({ chatId });
});

router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const userChats = database.chats[userId] || [];
  res.json(userChats.map(chat => ({
    chatId: chat.chatId,
    lastMessage: chat.messages[chat.messages.length - 1]?.text || ''
  })));
});

router.get('/:chatId', verifyToken, (req, res) => {
  const userId = req.user.id;
  const chatId = parseInt(req.params.chatId);
  const chat = database.chats[userId]?.find(c => c.chatId === chatId);
  if (!chat) return res.status(404).send('Chat not found');
  res.json(chat.messages);
});

module.exports = router;