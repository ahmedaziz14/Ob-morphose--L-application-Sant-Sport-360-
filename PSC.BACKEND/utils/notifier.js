// backend/utils/notifier.js
const supabase = require('../config/supabase');

const notifyAllUsers = async (io, title, message, type, relatedId) => {
  try {
    // 1. Récupérer tous les IDs des utilisateurs (depuis la table profiles)
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id');

    if (fetchError) throw fetchError;

    if (users && users.length > 0) {
      // 2. Préparer le tableau d'objets pour le Bulk Insert Supabase
      const notificationsToInsert = users.map(user => ({
        user_id: user.id,
        title: title,
        message: message,
        type: type,
        related_id: relatedId
      }));

      // 3. Insérer toutes les notifications en base en une seule fois
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertError) throw insertError;
      
      console.log(`✅ ${users.length} notifications enregistrées en base pour le type: ${type}`);

      // 4. ⚡ ÉMISSION TEMPS RÉEL VIA SOCKET.IO ⚡
      // Si on a bien passé l'objet 'io' en paramètre, on envoie le signal
      if (io) {
        io.emit('new_notification', {
          title: title,
          message: message,
          type: type,
          related_id: relatedId
        });
        console.log(`📡 Signal Socket.io "new_notification" diffusé à tous les clients connectés.`);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications globales:", error.message);
  }
};

module.exports = { notifyAllUsers };