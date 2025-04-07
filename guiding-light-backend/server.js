const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const database = require('./database');
const openai = require('./services/openai');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const port = process.env.PORT || 5000;

// Apply middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// Mount route handlers
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// Socket.io middleware to authenticate users
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('Authentication error'));
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = verified.id;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  socket.on('sendMessage', async ({ chatId, message }) => {
    try {
      // Find the user's chat
      if (!database.chats[socket.userId]) {
        database.chats[socket.userId] = [];
      }
      
      const chat = database.chats[socket.userId].find(c => c.chatId === chatId);
      if (!chat) {
        console.error('Chat not found:', chatId);
        return;
      }
      
      // Add and emit user message
      const userMessage = { 
        sender: 'user', 
        text: message,
        timestamp: new Date()
      };
      chat.messages.push(userMessage);
      io.emit('message', { ...userMessage, chatId });
      
      // Prepare conversation history and call OpenAI API
      const conversationHistory = chat.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // Add and emit AI response
      const aiMessage = { 
        sender: 'ai', 
        text: completion.choices[0].message.content,
        timestamp: new Date()
      };
      chat.messages.push(aiMessage);
      io.emit('message', { ...aiMessage, chatId });
      
    } catch (err) {
      console.error('Error in message handling:', err);
      
      // Handle errors gracefully
      const errorMessage = { 
        sender: 'ai', 
        text: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      
      if (database.chats[socket.userId]) {
        const chat = database.chats[socket.userId].find(c => c.chatId === chatId);
        if (chat) {
          chat.messages.push(errorMessage);
        }
      }
      
      io.emit('message', { ...errorMessage, chatId });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});