const supabase = require('../config/supabase');

// --- FONCTION CLÉ : Trouver ou Créer une Conversation ---
const findOrCreateConversation = async (user1, user2) => {
  // ✅ 1. SÉCURITÉ : Vérifier que les deux utilisateurs existent
  const { data: users, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .in('id', [user1, user2]);

  // S'il ne trouve pas EXACTEMENT 2 profils, on arrête tout
  if (checkError || !users || users.length < 2) {
    console.error("❌ Erreur : Un des utilisateurs n'existe pas dans la table 'profiles'.");
    return null; // On retourne null pour signaler l'échec
  }

  // ✅ 2. Tri des IDs pour l'unicité
  const [participantA, participantB] = [user1, user2].sort();

  // 3. Chercher si elle existe déjà
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .maybeSingle();

  if (existing) return existing.id;

  // 4. Sinon, on la crée
  const { data: created, error } = await supabase
    .from('conversations')
    .insert([{ participant_a: participantA, participant_b: participantB }])
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
        const { data: retry } = await supabase.from('conversations')
            .select('id').eq('participant_a', participantA).eq('participant_b', participantB).single();
        return retry.id;
    }
    throw error;
  }
  return created.id;
};

module.exports = {
  // 1. Récupérer les contacts
  getContacts: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, specialty')
        .neq('id', req.user.id)
        .in('role', ['doctor', 'coach']);

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Inbox
  getConversations: async (req, res) => {
    try {
      const myId = req.user.id;
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          pA:participant_a(id, full_name, avatar_url),
          pB:participant_b(id, full_name, avatar_url)
        `)
        .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const formatted = data.map(c => ({
        id: c.id,
        last_message: c.last_message_preview,
        date: c.last_message_at,
        contact: c.participant_a === myId ? c.pB : c.pA
      }));

      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Récupérer les messages
  getMessages: async (req, res) => {
    try {
      const myId = req.user.id;
      const { contactId } = req.params;

      const conversationId = await findOrCreateConversation(myId, contactId);

      // Si conversationId est null (car l'utilisateur n'existe pas), on renvoie une erreur propre
      if (!conversationId) {
        return res.status(404).json({ error: "Utilisateur introuvable ou profil supprimé." });
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      res.json({ conversationId, messages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Envoyer un message (REST)
  // 4. Envoyer un message (REST)
  sendMessage: async (req, res) => {
    try {
      const senderId = req.user.id;
      const { contactId } = req.params;
      const { content, tempId } = req.body; // Récupère tempId s'il est envoyé via l'API

      if (!content) return res.status(400).json({ error: "Contenu requis" });

      const conversationId = await findOrCreateConversation(senderId, contactId);
      
      if (!conversationId) {
        return res.status(404).json({ error: "Utilisateur introuvable." });
      }

      const { data: msg, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: contactId,
          content: content
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase.from('conversations')
        .update({ 
          last_message_preview: content, 
          last_message_at: new Date() 
        })
        .eq('id', conversationId);

      // ✅ NOUVEAU : Récupérer l'instance globale de Socket.io
      const io = req.app.get('io');
      
      if (io) {
        const messageResponse = { ...msg, tempId: tempId || null };
        
        // Diffuser le message dans la room et au destinataire en temps réel
        io.to(conversationId).emit('receive_message', messageResponse);
        io.to(contactId).emit('new_message_notification', messageResponse);
      }

      res.json(msg);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};