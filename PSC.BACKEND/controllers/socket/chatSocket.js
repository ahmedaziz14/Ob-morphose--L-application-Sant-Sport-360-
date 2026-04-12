const supabase = require('../../config/supabase');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Auth error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (e) { next(new Error('Auth error')); }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connecté: ${socket.user.id}`);

    // ✅ NOUVEAU : L'utilisateur rejoint un "canal personnel" avec son ID
    // Cela permet de lui envoyer des messages n'importe où sur l'application
    socket.join(socket.user.id);

    // 1. Rejoindre une salle de conversation spécifique
    socket.on('join_room', (conversationId) => {
      socket.join(conversationId);
      console.log(`📥 ${socket.user.id} a rejoint la room: ${conversationId}`);
    });

    // 2. Envoyer un message via Websocket
    socket.on('send_message', async (data) => {
      const { conversationId, receiverId, content, tempId } = data; 
      const senderId = socket.user.id;

      try {
        const { data: msg, error } = await supabase
          .from('messages')
          .insert([{ conversation_id: conversationId, sender_id: senderId, receiver_id: receiverId, content: content }])
          .select().single();

        if (error) return console.error(error);

        // Update de la conversation
        await supabase.from('conversations')
          .update({ 
            last_message_preview: content, 
            last_message_at: new Date() 
          })
          .eq('id', conversationId);

        const messageResponse = { ...msg, tempId };

        // ✅ ÉMISSION 1 : À la conversation (pour la fenêtre de chat ouverte)
        io.to(conversationId).emit('receive_message', messageResponse);

        // ✅ ÉMISSION 2 : Au canal personnel du destinataire (pour mettre à jour l'inbox / badge)
        io.to(receiverId).emit('new_message_notification', messageResponse);

      } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => console.log('🔴 Déconnecté'));
  });
};