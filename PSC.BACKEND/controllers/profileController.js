const supabase = require('../config/supabase');

// 1. Récupérer MON profil
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(200).json({ message: "Profil vide", profile: {} });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du profil." });
  }
};

// 2. Récupérer le profil PUBLIC
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params; 
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, bio, specialty, contact_email') 
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: "Utilisateur introuvable" });

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================================
// 3. Mettre à jour SES infos (LOGIQUE MODIFIÉE)
// ============================================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré depuis le token JWT
    
    // 1. On récupère les données envoyées
    const { 
      full_name, birth_date, weight_kg, height_cm, 
      mobility_status, health_goals, bio, 
      contact_email 
      // Note : On NE récupère PAS 'role' ni 'specialty' ici par sécurité.
    } = req.body;

    // 2. Préparer l'objet de mise à jour
    // On met uniquement les champs qui ont le droit d'être modifiés
    const updates = {
      full_name,
      birth_date,
      weight_kg,
      height_cm,
      mobility_status,
      health_goals,
      bio,
      contact_email,
      updated_at: new Date() // On met à jour la date de modif
    };

    // Nettoyage : On enlève les clés undefined (si le front ne les envoie pas)
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    // 3. Exécution de la mise à jour sur la table 'profiles'
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // 4. Gestion de l'historique de poids (inchangé)
    // Si l'utilisateur a modifié son poids, on l'ajoute à l'historique
    if (weight_kg) {
      const { error: weightError } = await supabase
        .from('weight_history')
        .insert({
          user_id: userId,
          weight_kg: weight_kg
        });
      
      if (weightError) console.error("Erreur historique poids:", weightError.message);
    }

    res.json({ 
      message: "Profil mis à jour avec succès.", 
      profile: data 
    });

  } catch (err) {
    console.error("Erreur updateProfile:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil." });
  }
};
// 4. Uploader Avatar (Inchangé)
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ error: "Aucune image reçue" });

    const file = req.file;
    const ext = file.mimetype.split('/')[1];
    const fileName = `avatars/${userId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = publicData.publicUrl;

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (dbError) throw dbError;

    res.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    console.error("❌ Avatar Upload:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getMyProfile, 
  getPublicProfile, 
  updateProfile, 
  uploadAvatar
};