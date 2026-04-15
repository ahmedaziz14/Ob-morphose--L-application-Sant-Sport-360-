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
app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json()); 

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