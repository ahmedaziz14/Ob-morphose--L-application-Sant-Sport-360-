const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Upload image
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. Lire les articles (Public pour les connectés)
// Ex: GET /api/content?category=nutrition
router.get('/', protect, contentController.getArticles);
router.get('/:id', protect, contentController.getArticleById);

// 2. Créer un article (Pro & Admin)
router.post(
  '/', 
  protect, 
  checkRole(['medecin', 'nutritionist', 'admin']), 
  upload.single('image'), 
  contentController.createArticle
);

// 3. Supprimer (Pro & Admin)
router.delete(
  '/:id', 
  protect, 
  checkRole(['medecin', 'nutritionist', 'admin']), 
  contentController.deleteArticle
);

module.exports = router;