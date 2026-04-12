// Fichier: check.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // On demande à Google : "Quels modèles j'ai le droit d'utiliser ?"
    // Note: Pour les versions récentes du SDK, on n'a pas toujours listModels direct, 
    // mais essayons d'abord de voir si la clé fonctionne.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Le modèle gemini-1.5-flash est bien initialisé.");
    
    const result = await model.generateContent("Test");
    console.log("✅ Test réussi :", result.response.text());
    
  } catch (error) {
    console.error("❌ Erreur :", error.message);
    console.log("⚠️ Si 404 Not Found : Vérifie que tu as bien fait 'npm install @google/generative-ai@latest'");
  }
}

listModels();