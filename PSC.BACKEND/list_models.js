require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("🔍 Recherche des modèles disponibles pour ta clé...");

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error("❌ ERREUR API :", data.error.message);
    } else if (data.models) {
      console.log("✅ Modèles trouvés :");
      // On affiche seulement ceux qui supportent la génération de contenu
      const visionModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      
      visionModels.forEach(m => {
        // On cherche ceux qui contiennent "vision" ou "flash" ou "1.5"
        console.log(`👉 ${m.name.replace('models/', '')}`);
      });
    } else {
      console.log("⚠️ Aucune liste reçue.");
    }
  })
  .catch(err => console.error("❌ Erreur Réseau :", err));