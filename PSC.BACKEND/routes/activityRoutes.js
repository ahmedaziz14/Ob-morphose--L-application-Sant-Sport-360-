const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

// --- NOUVELLES ROUTES (Flux interactif) ---

// 1. Démarrer une séance (Au clic sur "Commencer")
// POST /api/activities/start
router.post('/start', protect, activityController.startActivity);

// 2. Cocher un exercice (Au clic sur une case)
// POST /api/activities/mark-exercise
router.post('/mark-exercise', protect, activityController.markExerciseDone);

// 3. Terminer la séance (Au clic sur "Valider")
// POST /api/activities/finish
router.post('/finish', protect, activityController.finishActivity);


// --- ROUTES EXISTANTES (Consultation) ---

// 4. Voir tout l'historique (Séances terminées uniquement)
// GET /api/activities/history
router.get('/history', protect, activityController.getMyHistory);

// 5. Avoir les chiffres clés (pour le Dashboard)
// GET /api/activities/stats
router.get('/stats', protect, activityController.getMyStats);

// (Optionnel) Garder l'ancienne route '/log' si tu veux supporter l'ancien fonctionnement
// router.post('/log', protect, activityController.logActivity); 

module.exports = router;