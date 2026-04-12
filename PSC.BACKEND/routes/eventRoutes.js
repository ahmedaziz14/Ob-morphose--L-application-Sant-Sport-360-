const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, checkRole } = require('../middlewares/authMiddleware');

// 1. Voir les événements (Accessible à tous)
router.get('/', protect, eventController.getAllEvents);

// 2. Créer un événement (Admin & Pro uniquement)
router.post(
  '/', 
  protect, 
  checkRole(['professionnel', 'admin']), 
  eventController.createEvent
);

// 3. S'inscrire / Se désinscrire (Patient)
// URL: POST /api/events/ID_EVENT/register
router.post('/:event_id/register', protect, eventController.registerToEvent);
router.delete('/:event_id/register', protect, eventController.unregisterFromEvent);

// 4. Voir "Mes événements" (Patient)
router.get('/my-registrations', protect, eventController.getMyRegistrations);

module.exports = router;