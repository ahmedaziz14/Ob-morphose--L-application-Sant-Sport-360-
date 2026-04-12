// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Au démarrage, on vérifie si l'utilisateur est déjà connecté
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userInfo');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Erreur chargement session:", e);
      } finally {
        setIsLoading(false); // On a fini de charger (le Splash Screen pourra partir)
      }
    };

    loadStorageData();
  }, []);

  // 2. Action de Connexion (Login)
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      
      // data contient { token, user, message } (voir ton Backend)
      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);

        // Sauvegarde persistante dans le téléphone
        await SecureStore.setItemAsync('userToken', data.token);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(data.user));
        
        return { success: true };
      }
    } catch (error) {
      return { success: false, msg: error.message };
    }
  };

  // 3. Action d'Inscription (Register)
  const register = async (email, password, role) => {
    try {
      await authAPI.register(email, password, role);
      // Après l'inscription, on ne connecte pas forcément auto, on renvoie juste succès
      return { success: true };
    } catch (error) {
      return { success: false, msg: error.message };
    }
  };

  // 4. Action de Déconnexion (Logout)
  const logout = async () => {
    try {
      // On supprime tout du téléphone
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userInfo');
      
      // On vide l'état
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};