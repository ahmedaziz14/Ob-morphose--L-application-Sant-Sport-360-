const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Config Multer pour les vidéos/images
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// --- ROUTES ---

// 1. Voir tous les programmes (Accessible à tous les connectés : patients et pros)
router.get('/', protect, sportController.getAllPrograms);

// 2. Voir le détail d'un programme (Accessible à tous)
router.get('/:id', protect, sportController.getProgramDetails);

// 3. Créer un Programme (Réservé aux COACHS et ADMINS)
// ⚠️ CHANGEMENT ICI : On remplace 'professionnel' par 'coach'
router.post(
  '/', 
  protect, 
  checkRole(['coach', 'admin']), 
  sportController.createProgram
);

// 4. Ajouter un exercice à un programme (Réservé aux COACHS et ADMINS)
// ⚠️ CHANGEMENT ICI AUSSI
router.post(
  '/:program_id/exercises', 
  protect, 
  checkRole(['coach', 'admin']), 
  upload.single('media'), 
  sportController.addExerciseToProgram
);

module.exports = router;