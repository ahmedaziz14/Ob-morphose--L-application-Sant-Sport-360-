const supabase = require('../config/supabase');
const { notifyAllUsers } = require('../utils/notifier');

// 1. Créer un Événement
const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, max_participants } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('events')
      .insert([{
        title,
        description,
        event_date,
        location,
        organizer_id: userId,
        max_participants: max_participants || 50,
        current_participants: 0 // On initialise à 0
      }])
      .select()
      .single();

    if (error) throw error;

    // ✅ MODIFICATION ICI : On récupère Socket.io et on le passe au notifier
    const io = req.app.get('io');
    
    await notifyAllUsers(
      io, // 👈 Ajout de 'io' en premier paramètre
      "Nouvel Événement ! 📅",
      `L'événement "${title}" vient d'être organisé. Inscrivez-vous vite !`,
      "event",
      data.id
    );

    res.status(201).json({ message: "Événement créé !", event: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 2. Voir tous les événements
const getAllEvents = async (req, res) => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizer_id (
          id, full_name, avatar_url, role
        )
      `)
      .gte('event_date', now)
      .order('event_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. S'inscrire à un événement (LOGIQUE MODIFIÉE)
const registerToEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;

    // --- ÉTAPE A : Vérifier si l'événement est complet ---
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('max_participants, current_participants')
      .eq('id', event_id)
      .single();

    if (eventError) throw eventError;

    // Si le nombre actuel atteint (ou dépasse) le max
    if (event.current_participants >= event.max_participants) {
      return res.status(400).json({ error: "Désolé, cet événement est complet." });
    }

    // --- ÉTAPE B : Tenter l'inscription ---
    const { error: insertError } = await supabase
      .from('event_registrations')
      .insert([{ event_id, user_id: userId }]);

    if (insertError) {
      if (insertError.code === '23505') return res.status(409).json({ error: "Déjà inscrit." });
      throw insertError;
    }

    // --- ÉTAPE C : Mettre à jour le compteur (+1) ---
    // Note: Idéalement, on utiliserait une fonction RPC pour éviter les conflits simultanés, 
    // mais cette méthode fonctionne pour une charge normale.
    const newCount = event.current_participants + 1;
    
    await supabase
      .from('events')
      .update({ current_participants: newCount })
      .eq('id', event_id);

    res.status(201).json({ message: "Inscription validée !", places_restantes: event.max_participants - newCount });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Voir mes inscriptions (Inchangé)
const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('event_registrations')
      .select('registered_at, event:events (*)')
      .eq('user_id', userId);

    if (error) throw error;
    const formattedData = data.map(reg => ({
      registered_at: reg.registered_at,
      ...reg.event 
    }));
    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Se désinscrire (LOGIQUE MODIFIÉE)
const unregisterFromEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;

    // --- ÉTAPE A : Supprimer l'inscription ---
    const { error, count } = await supabase // 'count' nous dit si une ligne a été supprimée
      .from('event_registrations')
      .delete({ count: 'exact' }) 
      .eq('event_id', event_id)
      .eq('user_id', userId);

    if (error) throw error;

    // Si 'count' est 0, c'est que l'utilisateur n'était pas inscrit, donc on ne décrémente pas
    if (count === 0) {
      return res.status(404).json({ error: "Inscription introuvable." });
    }

    // --- ÉTAPE B : Mettre à jour le compteur (-1) ---
    // On récupère d'abord le nombre actuel
    const { data: event } = await supabase
      .from('events')
      .select('current_participants')
      .eq('id', event_id)
      .single();

    if (event) {
      // On s'assure de ne pas descendre en dessous de 0
      const newCount = Math.max(0, event.current_participants - 1);
      
      await supabase
        .from('events')
        .update({ current_participants: newCount })
        .eq('id', event_id);
    }

    res.json({ message: "Désinscription effectuée." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createEvent, getAllEvents, registerToEvent, getMyRegistrations, unregisterFromEvent };