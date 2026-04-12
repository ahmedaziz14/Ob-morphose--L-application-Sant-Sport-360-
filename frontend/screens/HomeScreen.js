import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl, ActivityIndicator 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { userAPI, activityAPI, notificationAPI } from '../services/api'; 
import { Ionicons } from '@expo/vector-icons'; 

import { io } from 'socket.io-client';

// ✅ URL unifiée pour éviter les bugs
const SOCKET_URL = 'http://192.168.1.9:3001';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ 
    sessionsThisWeek: 0, totalCalories: 0, totalDuration: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const animation = useRef(null);

  // --- LOGIQUE SOCKET.IO ---
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log("✅ SOCKET CONNECTÉ AVEC SUCCÈS ! ID:", socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log("❌ ERREUR SOCKET :", err.message);
    });

    socket.on('new_notification', (data) => {
      console.log("🔔 NOTIFICATION REÇUE EN DIRECT :", data);
      setHasNewNotif(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    try {
      const [profileData, statsData, notifsData] = await Promise.all([
        userAPI.getProfile(),
        activityAPI.getStats(),
        notificationAPI.getNotifications()
      ]);
      
      setProfile(profileData);
      setStats(statsData);

      if (notifsData && Array.isArray(notifsData)) {
        const hasUnread = notifsData.some(n => !n.is_read);
        setHasNewNotif(hasUnread);
      }
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- ✅ LOGIQUE METIER CORRIGÉE POUR L'ADMINISTRATEUR ---
  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach' || isAdmin;
  const isMedical = user?.role === 'medecin' || user?.role === 'nutritionist' || isAdmin;
  const isPro = isCoach || isMedical; 

  const weeklyGoal = 3;
  const progressPercent = Math.min((stats.sessionsThisWeek / weeklyGoal) * 100, 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          
          <Text style={styles.userName}>
             {user?.role === 'medecin' ? 'Dr. ' : ''}{profile?.full_name || "Utilisateur"}
          </Text>

          {isPro && (
             <View style={styles.proBadge}>
               {/* ✅ AFFICHAGE DU BON TEXTE POUR L'ADMIN */}
               <Text style={styles.proBadgeText}>
                 {isAdmin 
                    ? 'Administrateur' 
                    : (user?.role === 'coach' 
                        ? 'Coach Sportif' 
                        : (user?.role === 'medecin' ? 'Médecin' : 'Nutritionniste')
                      )
                 }
               </Text>
             </View>
          )}
        </View>

        <View style={styles.headerIconsContainer}>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => {
              setHasNewNotif(false); 
              navigation.navigate('Notifications'); 
            }}
          >
            <Ionicons name="notifications-outline" size={28} color="#333" />
            
            {hasNewNotif && (
              <View style={styles.badgeIndicator} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.lottieAvatarContainer}>
                 <LottieView
                  autoPlay
                  ref={animation}
                  style={{ width: 45, height: 45 }}
                  source={require('../animations/Profile Avatar for Child.json')} 
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekCard}>
        <View style={styles.weekHeaderRow}>
            <Text style={styles.weekTitle}>Cette semaine</Text>
            <Ionicons name="trophy" size={20} color="#FFD700" />
        </View>
        
        <View style={styles.weekRow}>
          <Text style={styles.bigNumber}>{stats.sessionsThisWeek}</Text>
          <Text style={styles.unit}>séances</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.goalText}>
            Objectif : {stats.sessionsThisWeek} / {weeklyGoal} séances
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="flame" size={24} color="#FF3B30" />
          </View>
          <Text style={styles.statValue}>{stats.totalCalories}</Text>
          <Text style={styles.statLabel}>Kcal brûlées</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="time" size={24} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>
            {Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}
          </Text>
          <Text style={styles.statLabel}>Temps total</Text>
        </View>
      </View>

      {isPro && (
        <>
          <Text style={styles.sectionTitle}>Mes Outils Pro</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateEvent')}>
              <View style={[styles.iconPlaceholder, { backgroundColor: '#FFF3E0' }]}><Ionicons name="calendar" size={24} color="#FF9800" /></View>
              <Text style={styles.gridLabel}>Créer Event</Text>
            </TouchableOpacity>

            {isCoach && (
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateProgram')}>
                <View style={[styles.iconPlaceholder, { backgroundColor: '#E3F2FD' }]}><Ionicons name="barbell" size={24} color="#007AFF" /></View>
                <Text style={styles.gridLabel}>Créer Prog.</Text>
              </TouchableOpacity>
            )}

            {isMedical && (
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateContent', { category: user.role === 'nutritionist' ? 'nutrition' : 'medical' })}>
                <View style={[styles.iconPlaceholder, { backgroundColor: '#E8F5E9' }]}><Ionicons name="newspaper" size={24} color="#34C759" /></View>
                <Text style={styles.gridLabel}>Publier Art.</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Explorer</Text>
      <View style={styles.gridContainer}>
        
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SportListStack')}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#FF9500' }]}><Text style={styles.iconText}>🏃</Text></View>
          <Text style={styles.gridLabel}>Sport</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('NutritionScanner')}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#26C6DA' }]}><Ionicons name="camera" size={28} color="#fff" /></View>
          <Text style={styles.gridLabel}>Scan IA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ContentList', { category: 'nutrition' })}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#34C759' }]}><Text style={styles.iconText}>🥗</Text></View>
          <Text style={styles.gridLabel}>Nutrition</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ContentList', { category: 'medical' })}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#FF3B30' }]}><Text style={styles.iconText}>❤️</Text></View>
          <Text style={styles.gridLabel}>Médical</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Events')}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#0A84FF' }]}><Text style={styles.iconText}>📅</Text></View>
          <Text style={styles.gridLabel}>Événements</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Inbox')}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#5856D6' }]}><Text style={styles.iconText}>💬</Text></View>
          <Text style={styles.gridLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Activity')}>
          <View style={[styles.iconPlaceholder, { backgroundColor: '#8E8E93' }]}><Text style={styles.iconText}>📜</Text></View>
          <Text style={styles.gridLabel}>Historique</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 40, 
    paddingBottom: 60 
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 16, color: '#666' },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#000' },
  
  proBadge: { backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  proBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 20, 
    position: 'relative', 
  },
  badgeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#F2F2F7', 
    zIndex: 10,
  },

  avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#ddd', borderWidth: 2, borderColor: '#fff' },
  lottieAvatarContainer: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },

  weekCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  weekTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  weekRow: { flexDirection: 'row', alignItems: 'baseline' },
  bigNumber: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  unit: { color: 'rgba(255,255,255,0.8)', fontSize: 18, marginLeft: 8 },
  
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  goalText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { 
    width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', elevation: 2 },
  iconPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconText: { fontSize: 24 },
  gridLabel: { fontWeight: '600', color: '#333' },

  logoutButton: { 
    marginTop: 10, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    borderColor: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.05)' 
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});