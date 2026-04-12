require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const chatSocket = require('./controllers/socket/chatSocket');

const PORT = process.env.PORT || 3001;

// Créer le serveur HTTP
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ MODIFICATION ICI : On rend 'io' globalement accessible dans l'application Express
app.set('io', io);

// Initialiser le module Socket.io pour le chat
chatSocket(io);

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time chat and notifications`);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});