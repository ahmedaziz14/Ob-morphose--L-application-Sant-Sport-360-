import { API_URL } from './api';
import { customFetch } from './api';

export const chatAPI = {
  // 📜 Historique conversation + messages
  getMessages: async (contactId) => {
    const res = await customFetch(`/chat/conversation/${contactId}`, {
      method: 'GET'
    });

    // Sécurité
    return {
      conversationId: res.data?.conversationId || null,
      messages: Array.isArray(res.data?.messages)
        ? res.data.messages
        : []
    };
  }
};
