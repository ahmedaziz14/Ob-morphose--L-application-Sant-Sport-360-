const supabase = require('../config/supabase');
const { notifyAllUsers } = require('../utils/notifier');

// --- PARTIE PROFESSIONNEL (CRÉATION) ---

// 1. Créer un nouveau Programme (ex: "Remise en forme - Semaine 1")
const createProgram = async (req, res) => {
  try {
    const { title, description, difficulty } = req.body;
    const userId = req.user.id; // L'ID du coach connecté

    const { data, error } = await supabase
      .from('sport_programs')
      .insert([{
        title,
        description,
        difficulty, // 'debutant', 'intermediaire', 'avance', 'adapte_faiblesse'
        created_by: userId,
        status: 'publie' // On publie direct pour l'instant (ou 'en_attente')
      }])
      .select()
      .single();

    if (error) throw error;

    // ✅ MODIFICATION ICI : On récupère io et on le passe au notifier
    const io = req.app.get('io');

    await notifyAllUsers(
      io, // 👈 Ajout de 'io' ici
      "Nouveau Programme Sportif ! 🏋️",
      `Un nouveau programme "${title}" est disponible.`,
      "program",
      data.id
    );

    res.status(201).json({ message: "Programme créé !", program: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Ajouter un Exercice à un Programme (avec Vidéo/Image)
const addExerciseToProgram = async (req, res) => {
  try {
    const { program_id } = req.params; // On récupère l'ID du programme dans l'URL
    const { title, instructions, duration_minutes, order_index } = req.body;
    const file = req.file; // Le fichier vidéo ou image

    let mediaUrl = null;

    // A. Upload du fichier (si présent)
    if (file) {
      const fileExt = file.originalname.split('.').pop();
      // Nom : programs/PROGRAM_ID/timestamp.ext
      const fileName = `programs/${program_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media_content') // Bucket créé précédemment
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media_content')
        .getPublicUrl(fileName);
        
      mediaUrl = publicUrlData.publicUrl;
    }

    // B. Enregistrement en base de données
    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        program_id,
        title,
        instructions,
        duration_minutes,
        order_index: order_index || 1,
        media_url: mediaUrl
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Exercice ajouté !", exercise: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PARTIE PATIENT (LECTURE) ---

// 3. Récupérer tous les programmes (avec filtre optionnel)
const getAllPrograms = async (req, res) => {
  try {
    const { difficulty } = req.query;

    let query = supabase
      .from('sport_programs')
      .select(`
        *,
        author:profiles!fk_program_profiles (
          id,
          full_name,
          role,
          avatar_url,
          specialty
        )
      `)
      .eq('status', 'publie');

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('❌ getAllPrograms:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// 4. Récupérer un Programme complet avec ses exercices
const getProgramDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('sport_programs')
      .select(`
        *,
        exercises (*),
        author:profiles!fk_program_profiles (
          id,
          full_name,
          avatar_url,
          role,
          specialty
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Erreur Supabase détaillée :", error);
      throw error;
    }

    if (data && data.exercises) {
      data.exercises.sort((a, b) => a.order_index - b.order_index);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports={createProgram,addExerciseToProgram, getAllPrograms,getProgramDetails} ; 