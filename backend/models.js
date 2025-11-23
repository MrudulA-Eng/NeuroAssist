
const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  userId: String,
  label: String,
  emoji: String,
  completed: Boolean,
  timestamp: Number
});

const emotionSchema = new mongoose.Schema({
  userId: String,
  label: String,
  emoji: String,
  intensity: Number,
  timestamp: Number
});

const messageSchema = new mongoose.Schema({
  userId: String, // The parent/user owning the data
  contactId: String, // The therapist ID
  senderId: String, // 'me' or therapistId
  text: String,
  type: String,
  points: Number,
  timestamp: Number
});

const Routine = mongoose.model('Routine', routineSchema);
const Emotion = mongoose.model('Emotion', emotionSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Routine, Emotion, Message };
