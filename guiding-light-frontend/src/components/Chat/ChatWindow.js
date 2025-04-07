import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

const ChatWindow = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Set up socket connection
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Create socket connection with current token
    const newSocket = io('http://localhost:5000', {
      query: { token }
    });

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      newSocket.disconnect();
    };
  }, [token, navigate]);

  // Fetch messages and setup message listener
  useEffect(() => {
    if (!token || !socket) return;

    // Get chat history
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chats/${chatId}`, {
          headers: { Authorization: token },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();

    // Listen for new messages
    const messageHandler = (message) => {
      if (message.chatId === parseInt(chatId)) {
        console.log('Received message:', message);
        setMessages(prev => [...prev, message]);
      }
    };
    
    socket.on('message', messageHandler);
    return () => socket.off('message', messageHandler);
  }, [chatId, token, socket]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const sendMessage = () => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }
    
    if (input.trim()) {
      console.log('Sending message:', { chatId: parseInt(chatId), message: input });
      socket.emit('sendMessage', { chatId: parseInt(chatId), message: input });
      setInput('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="chat-window"
    >
      <div className="chat-header">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
        >
          Back
        </motion.button>
        <h2>Chat {chatId}</h2>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`chat-message ${msg.sender}`}
          >
            <p>{msg.text}</p>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
        >
          Send
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatWindow;