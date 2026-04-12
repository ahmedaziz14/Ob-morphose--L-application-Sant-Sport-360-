const express = require('express');
const router = express.Router();
// Vérifie bien que le chemin vers le controller est bon
const chatController = require('../controllers/chatController'); 
const { protect } = require('../middlewares/authMiddleware');

// Route pour les contacts
router.get('/contacts', protect, chatController.getContacts);

// Route pour l'inbox
router.get('/inbox', protect, chatController.getConversations);

// Route pour les messages (C'est la ligne 13 qui plantait)
// Maintenant ça marchera car getMessages existe dans le contrôleur
router.get('/messages/:contactId', protect, chatController.getMessages);
router.post('/messages/:contactId', protect, chatController.sendMessage);

module.exports = router;