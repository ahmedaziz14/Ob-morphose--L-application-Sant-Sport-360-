import * as SecureStore from 'expo-secure-store';


const API_URL = 'https://api-obemorphose.onrender.com/api'; 

const customFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  
  const token = await SecureStore.getItemAsync('userToken');

 
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  
  if (!options.isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    console.log(`📡 Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);

    // Gestion du cas où le serveur ne renvoie rien (204 No Content)
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur API:", data);
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    throw error;
  }
};
export const authAPI = {
  login: async (email, password) => {
    return customFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (email, password, role) => {
    return customFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },
};

export const userAPI = {
  // 1. Récupérer mon profil
  getProfile: async () => {
    return customFetch('/profile/me', { method: 'GET' });
  },

  // 2. Récupérer un profil public
  getPublicProfile: async (userId) => {
    return customFetch(`/profile/${userId}`, { method: 'GET' }); 
  },

  // 3. Récupérer mes stats
  getStats: async () => {
    return customFetch('/activities/stats', { method: 'GET' });
  },

  // 4. Mettre à jour mon profil (Texte)
  updateProfile: async (data) => {
    return customFetch('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 5. ✅ UPLOAD PHOTO DE PROFIL (La fonction manquante)
  uploadAvatar: async (formData) => {
    // On récupère le token manuellement car on n'utilise pas customFetch ici
    const token = await SecureStore.getItemAsync('userToken');

    const response = await fetch(`${API_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // ⚠️ CRUCIAL : Ne PAS ajouter 'Content-Type'. 
        // Le navigateur/React Native ajoutera automatiquement 'multipart/form-data' avec les 'boundaries'.
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'upload de l'image");
    }

    return data;
  }
};
export const sportAPI = {
  // --- LECTURE (Patient & Pro) ---

  // 1. Récupérer tous les programmes
  getAllPrograms: async () => {
    return customFetch('/sport', { method: 'GET' });
  },

  // 2. Récupérer un programme précis avec ses exercices
  getProgramDetails: async (id) => {
    return customFetch(`/sport/${id}`, { method: 'GET' });
  },

  // --- ÉCRITURE (Coach/Admin uniquement) ---

  // 3. Créer un nouveau programme
  createProgram: async (programData) => {
    // programData doit contenir : { title, description, difficulty }
    return customFetch('/sport', { 
      method: 'POST', 
      body: JSON.stringify(programData) 
    });
  },

  // 4. Ajouter un exercice (Avec gestion de fichier Vidéo/Image)
  addExercise: async (programId, exerciseData, mediaFile) => {
    const formData = new FormData();

    formData.append('title', exerciseData.title);
    formData.append('instructions', exerciseData.instructions);
    formData.append('duration_minutes', String(exerciseData.duration_minutes)); // Force string
    
    if (exerciseData.order_index) {
      formData.append('order_index', String(exerciseData.order_index));
    }

    if (mediaFile) {
      // 1. Déterminer l'extension
      const uriParts = mediaFile.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // 2. Déterminer le bon MIME Type (React Native déteste les types vides)
      let mimeType = mediaFile.type; 
      if (mimeType === 'image') mimeType = 'image/jpeg';
      if (mimeType === 'video') mimeType = 'video/mp4';
      if (!mimeType) {
         // Fallback si l'extension est connue
         mimeType = fileType === 'mp4' ? 'video/mp4' : 'image/jpeg';
      }

      formData.append('media', {
        uri: mediaFile.uri, // Sur iOS parfois il faut enlever 'file://', sur Android il le faut. Laisse tel quel via Expo.
        name: mediaFile.fileName || `upload.${fileType}`,
        type: mimeType, 
      });
    }

    console.log("📤 Envoi FormData vers :", `/sport/${programId}/exercises`);

    return customFetch(`/sport/${programId}/exercises`, { 
      method: 'POST', 
      body: formData,
      isMultipart: true // ✅ C'est ce flag qui dira à customFetch de ne pas toucher au Content-Type
    });
  }
};
export const articleAPI = {
  // --- LECTURE ---

  // 1. Récupérer les articles (avec filtre optionnel par catégorie)
  getArticles: async (category) => {
    // Si une catégorie est fournie, on l'ajoute à l'URL, sinon on charge tout
    const query = category ? `?category=${category}` : '';
    return customFetch(`/content${query}`, { method: 'GET' });
  },

  // 2. Détail d'un article
  getArticleDetails: async (id) => {
    return customFetch(`/content/${id}`, { method: 'GET' });
  },

  // --- ÉCRITURE (Médecins/Nutritionnistes) ---

  // 3. Créer un article (Avec Upload Image)
  createArticle: async (formData) => {
    // Le formData contient : title, content, category, et le fichier 'image'
    return customFetch('/content', { 
      method: 'POST', 
      body: formData,
      isMultipart: true // ⚠️ Très important pour que customFetch n'ajoute pas 'application/json'
    });
  },

  // 4. Supprimer un article
  deleteArticle: async (id) => {
    return customFetch(`/content/${id}`, { method: 'DELETE' });
  }
};
// ============================
export const chatAPI = {
  // 1. Récupérer les contacts (Docteurs/Coachs) pour démarrer une discussion
  getContacts: async () => {
    return customFetch('/chat/contacts', { method: 'GET' });
  },

  // 2. Inbox (Liste de mes conversations en cours)
  getConversations: async () => {
    return customFetch('/chat/inbox', { method: 'GET' });
  },

  // 3. Charger l'historique et initialiser la conversation (Get or Create)
  // Renvoie: { conversationId: '...', messages: [...] }
  getMessages: async (contactId) => {
    return customFetch(`/chat/messages/${contactId}`, { method: 'GET' });
  },

  // 4. Envoi de message via API REST (Fallback si le Socket a un souci)
  // Utile aussi pour tester avec Postman
  sendMessage: async (contactId, content) => {
    return customFetch(`/chat/messages/${contactId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
};
export const activityAPI = {
  // 1. Démarrer une séance (Nouveau)
  // Renvoie { activityId: ... }
  startActivity: async (programId) => {
    return customFetch('/activities/start', {
      method: 'POST',
      body: JSON.stringify({ program_id: programId })
    });
  },

  // 2. Cocher un exercice (Nouveau)
  // Renvoie { message, addedCalories, totalCalories }
  markExerciseDone: async (activityId, exerciseId) => {
    return customFetch('/activities/mark-exercise', {
      method: 'POST',
      body: JSON.stringify({ activityId, exerciseId })
    });
  },

  // 3. Terminer la séance (Remplace logActivity)
  finishActivity: async (data) => {
    // data = { activityId, feedback, duration_minutes }
    return customFetch('/activities/finish', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 4. Récupérer mon historique (Consultation)
  getHistory: async () => {
    return customFetch('/activities/history', { method: 'GET' });
  },

  // 5. Récupérer mes stats (Dashboard)
  getStats: async () => {
    return customFetch('/activities/stats', { method: 'GET' });
  },
  
  // (Obsolète mais gardé pour compatibilité si besoin)
  logActivity: async (data) => {
    return customFetch('/activities/log', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }
};

// ... exports (n'oubliez pas d'ajouter activityAPI dans l'export final)
export const eventAPI = {
  // Récupérer tous les événements futurs
  getAllEvents: async () => {
    return customFetch('/events', { method: 'GET' });
  },

  // Créer un événement (Pro/Admin)
  createEvent: async (eventData) => {
    return customFetch('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // S'inscrire à un événement
  register: async (eventId) => {
    return customFetch(`/events/${eventId}/register`, { method: 'POST' });
  },

  // Se désinscrire
  unregister: async (eventId) => {
    return customFetch(`/events/${eventId}/register`, { method: 'DELETE' });
  },

  // Voir mes inscriptions
  getMyRegistrations: async () => {
    return customFetch('/events/my-registrations', { method: 'GET' });
  },
};
// src/services/api.js

export const nutritionAPI = {
  // 1. Envoi Photo (Gemini)
  scanFoodImage: async (imageUri) => {
    const formData = new FormData();
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('image', {
      uri: imageUri,
      name: `food_scan.${fileType}`,
      type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
    });

    return customFetch('/nutrition/scan', { 
      method: 'POST', 
      body: formData, 
      isMultipart: true 
    });
  },

  // 2. Envoi Texte (API Ninjas)
  searchFoodText: async (text) => {
    return customFetch('/nutrition/search', {
      method: 'POST',
      body: JSON.stringify({ query: text })
    });
  }
};

// ============================
// NOTIFICATIONS API
// ============================
export const notificationAPI = {
  // 1. Récupérer toutes les notifications
  getNotifications: async () => {
    return customFetch('/notifications', { method: 'GET' });
  },

  // 2. Marquer UNE notification comme lue
  markAsRead: async (id) => {
    return customFetch(`/notifications/${id}/read`, { method: 'PUT' });
  },

  // 3. Marquer TOUTES les notifications comme lues
  markAllAsRead: async () => {
    return customFetch('/notifications/read-all', { method: 'PUT' });
  }
};