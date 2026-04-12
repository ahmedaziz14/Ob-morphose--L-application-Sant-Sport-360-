# 🏋️‍♂️ Health & Fitness Hub (Obémorphose- L'application Santé & Sport 360°)

Une application mobile complète de santé et de fitness permettant la mise en relation entre des patients et des professionnels (Coachs sportifs, Médecins, Nutritionnistes, Administrateurs).

## ✨ Fonctionnalités Principales

- **👨‍⚕️ Gestion des Rôles :** Espaces dédiés selon le rôle (Patient, Coach, Médecin, Admin).
- **🔔 Notifications Temps Réel :** Système de notifications push in-app via Socket.io.
- **📸 Scan IA Nutrition :** Analyse des repas par intelligence artificielle.
- **🏃‍♂️ Suivi d'Activité :** Tableau de bord dynamique avec suivi des calories et séances.
- **⚡ Upload Optimisé :** Compression d'images à la volée (via Sharp) pour des performances fluides.
- **💬 Chat en direct :** Communication en temps réel entre utilisateurs.

## 🛠️ Stack Technique

**Frontend (Application Mobile)**
- React Native & Expo
- React Navigation
- Socket.io-client (Temps réel)

**Backend (API Rest)**
- Node.js & Express
- Supabase (PostgreSQL & Storage)
- Socket.io (WebSockets)
- Sharp (Traitement d'images)
- JWT (Authentification sécurisée)

---

## 🚀 Installation & Lancement en local

### Prérequis
- Node.js (v18+)
- Un compte Supabase
- Expo CLI (`npm install -g expo-cli`)

### 1. Cloner le projet
```bash
git clone [https://github.com/ahmedaziz14/Ob-morphose.git](https://github.com/ahmedaziz14/Ob-morphose.git)
cd TonRepo