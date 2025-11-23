
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Routine, Emotion, Message } = require('./models');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/neuro-assist', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes

// 1. Routines
app.get('/api/routines', async (req, res) => {
  const { userId } = req.query;
  const routines = await Routine.find({ userId });
  res.json(routines);
});

app.post('/api/routines', async (req, res) => {
  const newRoutine = new Routine(req.body);
  const saved = await newRoutine.save();
  res.json(saved);
});

app.patch('/api/routines/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const updated = await Routine.findByIdAndUpdate(id, { completed }, { new: true });
  res.json(updated);
});

// 2. Emotions
app.get('/api/emotions', async (req, res) => {
  const { userId } = req.query;
  const emotions = await Emotion.find({ userId });
  res.json(emotions);
});

app.post('/api/emotions', async (req, res) => {
  const newEmotion = new Emotion(req.body);
  const saved = await newEmotion.save();
  res.json(saved);
});

// 3. Messages
app.get('/api/messages', async (req, res) => {
  const { userId, contactId } = req.query;
  // Fetch messages for a specific conversation
  const messages = await Message.find({ userId, contactId }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/api/messages', async (req, res) => {
  const newMessage = new Message(req.body);
  const saved = await newMessage.save();
  res.json(saved);
});

// 4. Login (Simple Mock for demo)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // logic matching the frontend mock
  const VALID_CREDENTIALS = [
    { username: 'parent1', password: '123456' },
    { username: 'parent2', password: '234567' },
    { username: 'parent3', password: '345678' }
  ];
  const user = VALID_CREDENTIALS.find(c => c.username === username && c.password === password);
  
  if (user) {
    res.json({ success: true, userId: username });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
