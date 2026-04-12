const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware'); // Import de votre middleware
const multer = require('multer');

// Config Multer : On garde le fichier en mémoire RAM le temps de l'envoyer à Supabase
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5 MB
});

// Routes
// 1. Voir mon profil (Il faut être connecté)
router.get('/me', protect, profileController.getMyProfile);

// 2. Mettre à jour mes infos (Il faut être connecté)
router.put('/me', protect, profileController.updateProfile);

// 3. Uploader ma photo (Il faut être connecté + envoyer un champ 'avatar')
router.post('/avatar', protect, upload.single('avatar'), profileController.uploadAvatar);
router.get('/:id', protect, profileController.getPublicProfile);

module.exports = router;