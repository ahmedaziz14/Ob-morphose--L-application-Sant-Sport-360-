const express = require('express'); 
const router = express.Router();
const nutritionController  =require ('../controllers/nutritionController') ; 
const {protect} = require('../middlewares/authMiddleware') ; 
const multer = require('multer');

// Configuration upload image (mémoire)
const upload = multer({ storage: multer.memoryStorage() });
router.post('/scan' , upload.single('image'),nutritionController.analyzeImage) ; 
router.post('/search', nutritionController.analyzeText) ; 

module.exports=router ; 
