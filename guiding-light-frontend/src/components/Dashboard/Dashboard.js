import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const [chats, setChats] = useState([]);
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchChats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/chats', {
          headers: { Authorization: token },
        });
        setChats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, [token, navigate]);

  const startNewChat = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/chats', {}, {
        headers: { Authorization: token },
      });
      navigate(`/chat/${res.data.chatId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="dashboard"
    >
      <div className="sidebar">
        <h3>Your Chats</h3>
        {chats.map(chat => (
          <motion.div
            key={chat.chatId}
            whileHover={{ backgroundColor: '#f0f0f0' }}
            onClick={() => navigate(`/chat/${chat.chatId}`)}
            className="chat-preview"
          >
            <p>Chat {chat.chatId}: {chat.lastMessage || 'No messages yet'}</p>
          </motion.div>
        ))}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewChat}
          className="new-chat-btn"
        >
          New Chat
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="logout-btn"
        >
          Logout
        </motion.button>
      </div>
      <div className="main-area">
        <h2>Welcome to Guiding Light</h2>
        <p>Select a chat or start a new one to begin.</p>
      </div>
    </motion.div>
  );
};

export default Dashboard;