const supabase = require('../config/supabase');

// 1. Démarrer une séance (Au moment où l'utilisateur clique sur "Commencer")
const startActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { program_id } = req.body;

    // On crée une activité vide avec 0 calories
    const { data, error } = await supabase
      .from('user_sport_activities')
      .insert([{
        user_id: userId,
        program_id: program_id,
        calories_burned: 0,
        status: 'in_progress',
        started_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Séance démarrée", activityId: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Marquer un exercice comme FAIT (et mettre à jour les calories)
const markExerciseDone = async (req, res) => {
  try {
    // On reçoit l'ID de la séance en cours et l'ID de l'exercice coché
    const { activityId, exerciseId } = req.body;

    // A. Récupérer les infos de l'exercice (notamment ses calories)
    const { data: exercise, error: exoError } = await supabase
      .from('exercises')
      .select('calories')
      .eq('id', exerciseId)
      .single();

    if (exoError) throw exoError;

    // B. Enregistrer que cet exercice est fait (Table de liaison)
    const { error: logError } = await supabase
      .from('activity_exercise_logs')
      .insert([{ activity_id: activityId, exercise_id: exerciseId }]);

    // Si erreur '23505' (Unicité), c'est qu'il est déjà coché, on ne fait rien
    if (logError) {
      if (logError.code === '23505') {
        return res.status(400).json({ message: "Exercice déjà validé." });
      }
      throw logError;
    }

    // C. Mettre à jour le total des calories dans la table principale
    // On appelle une RPC (procédure stockée) ou on fait une requête UPDATE simple.
    // Ici, méthode simple : on récupère l'activité, on ajoute, on sauvegarde.
    
    // 1. Lire calories actuelles
    const { data: activity } = await supabase
      .from('user_sport_activities')
      .select('calories_burned')
      .eq('id', activityId)
      .single();

    // 2. Calculer nouveau total
    const newTotal = (activity.calories_burned || 0) + (exercise.calories || 0);

    // 3. Sauvegarder
    await supabase
      .from('user_sport_activities')
      .update({ calories_burned: newTotal })
      .eq('id', activityId);

    res.json({ 
      message: "Exercice validé !", 
      addedCalories: exercise.calories,
      totalCalories: newTotal 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Terminer la séance (Met le statut à 'completed')
const finishActivity = async (req, res) => {
  try {
    const { activityId, feedback, duration_minutes } = req.body;

    const { data, error } = await supabase
      .from('user_sport_activities')
      .update({ 
        status: 'completed',
        feedback: feedback,
        duration_minutes: duration_minutes, // Durée réelle
        completed_at: new Date()
      })
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Séance terminée et enregistrée !", activity: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Voir mon historique (Inchangé)
const getMyHistory = async (req, res) => {
    // ... (Ton code existant)
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
          .from('user_sport_activities')
          .select(`*, program:sport_programs(title)`)
          .eq('user_id', userId)
          .eq('status', 'completed') // On ne montre que les finies
          .order('completed_at', { ascending: false });
    
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Stats (Inchangé)
const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Calculer la date du Lundi de la semaine en cours
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // Dimanche devient 7 au lieu de 0
    const startOfWeek = new Date(today);
    // On recule jusqu'à Lundi (si on est mercredi (3), on recule de 2 jours)
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0); // À minuit pile

    // 2. Récupérer toutes les activités TERMINÉES de l'utilisateur
    const { data, error } = await supabase
      .from('user_sport_activities')
      .select('id, completed_at, calories_burned, duration_minutes')
      .eq('user_id', userId)
      .eq('status', 'completed'); // Seulement celles finies

    if (error) throw error;

    // 3. Calculs Javascript
    const totalSessions = data.length;
    
    // On filtre celles qui sont après le début de la semaine
    const sessionsThisWeek = data.filter(activity => {
      const activityDate = new Date(activity.completed_at);
      return activityDate >= startOfWeek;
    }).length;

    // Calcul des calories totales (Bonus)
    const totalCalories = data.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
    
    // Calcul du temps total en minutes (Bonus)
    const totalDuration = data.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

    // 4. On renvoie tout ça au frontend
    res.json({
      totalSessions,
      sessionsThisWeek, // ✅ C'est le chiffre que tu veux pour le HomeScreen
      totalCalories,
      totalDuration
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
module.exports = { 
  startActivity, 
  markExerciseDone, 
  finishActivity, 
  getMyHistory, 
  getMyStats 
};