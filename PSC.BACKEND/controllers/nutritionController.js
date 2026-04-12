const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucune image fournie." });
    }

 const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash" // <- modèle qui est présent dans ta liste
});


    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `
Agis comme un expert en nutrition.
Analyse cette photo.
Identifie le plat et estime les calories totales et les macros.

Réponds UNIQUEMENT avec ce JSON strict :
{
  "name": "Nom du plat",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "message": "Court commentaire fun"
}
`;

    const result = await model.generateContent([
      prompt,
      imagePart,
    ]);

    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);

    res.json(data);
  } catch (error) {
    console.error("Erreur Gemini:", error);
    res.status(500).json({
      error: "Impossible d'analyser l'image.",
      details: error.message,
    });
  }
};

// --- 2. RECHERCHE TEXTE (Via API Ninjas) ---
const analyzeText = async (req, res) => {
  const { query } = req.body; // ex: "2 eggs and 100g chicken"

  if (!query) return res.status(400).json({ error: "Texte vide." });

  try {
    // ⚠️ Appel à API Ninjas
    const response = await fetch(`https://api.api-ninjas.com/v1/nutrition?query=${query}`, {
      headers: { 'X-Api-Key': process.env.API_NINJAS_KEY }
    });

    if (!response.ok) throw new Error(`Erreur API Ninjas: ${response.status}`);

    const items = await response.json();

    if (items.length === 0) {
      return res.status(404).json({ error: "Aliment non trouvé. Essayez en anglais (ex: 'chicken')." });
    }
    
    // Calcul des totaux (car API Ninjas renvoie un tableau d'aliments)
    let total = { 
        name: query, 
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0, 
        message: "Calculé avec précision via API Ninjas" 
    };
    
    items.forEach(item => {
      total.calories += item.calories;
      total.protein += item.protein_g;
      total.carbs += item.carbohydrates_total_g;
      total.fat += item.fat_total_g;
    });

    res.json(total);

  } catch (error) {
    console.error("Erreur Ninja:", error);
    res.status(500).json({ error: "Erreur lors de l'analyse textuelle." });
  }
};

module.exports = { analyzeImage, analyzeText };