const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    if (database.users.some(u => u.username === username)) {
      return res.status(400).send('Username already exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { 
      id: database.users.length + 1, 
      username, 
      password: hashedPassword 
    };
    
    database.users.push(user);
    res.status(201).send('User registered');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = database.users.find(u => u.username === username);
    
    if (!user) return res.status(400).send('Invalid username or password');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid username or password');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;