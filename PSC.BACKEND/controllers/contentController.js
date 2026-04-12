const supabase = require('../config/supabase');
const { notifyAllUsers } = require('../utils/notifier');
const sharp = require('sharp'); // ✅ OPTIMISATION 1 : Import de sharp

// 1. Créer un Article (Recette ou Conseil Médical)
const createArticle = async (req, res) => {
  try {
    const { title, content, category } = req.body; 
    const userId = req.user.id;
    const file = req.file; 

    let imageUrl = null;

    // A. Upload de l'image
    if (file) {
      // ✅ OPTIMISATION 2 : Compression de l'image AVANT de l'envoyer à Supabase
      // On réduit la taille à 1080px max de large, et on compresse en JPEG qualité 80%
      // Une image de 5 Mo passera à environ 150-300 Ko, l'upload sera 10x plus rapide !
      const optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 1080, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // On force l'extension en .jpg puisqu'on vient de la convertir
      const fileName = `articles/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('media_content')
        .upload(fileName, optimizedBuffer, { // 👈 On envoie le buffer compressé
          contentType: 'image/jpeg', // 👈 On force le type MIME
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media_content')
        .getPublicUrl(fileName);
        
      imageUrl = publicUrlData.publicUrl;
    }

    // B. Insertion en Base
    const { data, error } = await supabase
      .from('articles')
      .insert([{
        title,
        content,
        category,
        author_id: userId,
        status: 'publie',
        image_url: imageUrl
      }])
      .select()
      .single();

    if (error) throw error;
    
    const io = req.app.get('io');
    const emoji = category === 'nutrition' ? '🥗' : '❤️';
    
    // ✅ OPTIMISATION 3 : Suppression du "await" devant notifyAllUsers
    // En enlevant "await", le serveur lance la tâche de notification en "arrière-plan"
    // et répond immédiatement au frontend. L'utilisateur n'attend plus !
    notifyAllUsers(
      io,
      `Nouvel Article publié ! ${emoji}`,
      `L'article "${title}" vient d'être mis en ligne.`,
      "article",
      data.id
    ).catch(err => console.error("Erreur background notification:", err));

    // Réponse instantanée
    res.status(201).json({ message: "Article créé avec succès !", article: data });

  } catch (err) {
    console.error("Erreur createArticle:", err);
    res.status(500).json({ error: err.message });
  }
};
// 2. Lire les articles (MODIFIÉ POUR LE PROFIL AUTEUR)
const getArticles = async (req, res) => {
  try {
    const { category } = req.query; 

    let query = supabase
      .from('articles')
      // --- MODIFICATION ICI ---
      // On joint la table 'profiles' pour avoir le nom, l'avatar et le rôle
      // On utilise l'alias 'author' pour que le frontend s'y retrouve
      .select('*, author:profiles(id, full_name, avatar_url, role)') 
      .eq('status', 'publie')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Lire un article précis (MODIFIÉ POUR LE PROFIL AUTEUR)
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('articles')
      // --- MODIFICATION ICI AUSSI ---
      .select('*, author:profiles(id, full_name, avatar_url, role)')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Supprimer un article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data: article } = await supabase.from('articles').select('author_id').eq('id', id).single();
    
    if (!article) return res.status(404).json({ error: "Article introuvable" });

    if (userRole !== 'admin' && article.author_id !== userId) {
      return res.status(403).json({ error: "Non autorisé." });
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: "Article supprimé." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createArticle, getArticles, getArticleById, deleteArticle };