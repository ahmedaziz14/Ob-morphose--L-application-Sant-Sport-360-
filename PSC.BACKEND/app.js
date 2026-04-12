const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const sportRoutes = require('./routes/sportRoutes');
const contentRoutes = require('./routes/contentRoutes');
const eventRoutes = require('./routes/eventRoutes');

const activityRoutes = require('./routes/activityRoutes');
const chatRoutes = require('./routes/chatRoutes');
const nutritionRoutes=require('./routes/nutritionRoutes');
const notificationRoutes =require('./routes/notificationRoutes') ; 
const app = express();

// Middlewares globaux
app.use(cors()); // Autorise le Frontend
app.use(express.json()); // Permet de lire le JSON dans req.body

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/nutrition' , nutritionRoutes) ; 
app.use('/api/notifications' , notificationRoutes) ; 
// Route de test
app.get('/', (req, res) => {
  res.send('API Health Support est en ligne !');
});

module.exports = app;