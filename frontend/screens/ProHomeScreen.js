import React, { useState, useCallback, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
// On importe les APIs pour calculer les stats du pro
import { userAPI, chatAPI, sportAPI, contentAPI, eventAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons'; 

export default function ProHomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  
  // Stats "Business"
  const [stats, setStats] = useState({ 
    activePatients: 0, 
    contentCount: 0, 
    eventCount: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Déterminer le rôle pour l'affichage
  const isCoach = user?.role === 'coach';
  const isNutritionist = user?.role === 'nutritionist';
  const isDoctor = user?.role === 'doctor';

  // Couleur du thème selon le métier
  const themeColor = isDoctor ? '#FF3B30' : (isNutritionist ? '#34C759' : '#5856D6'); // Rouge, Vert, Violet

  const loadDashboard = async () => {
    try {
      // 1. Charger le profil
      const profileData = await userAPI.getProfile();
      setProfile(profileData);

      // 2. Calculer les stats "maison" (sans toucher au backend)
      // On lance toutes les requêtes en parallèle
      const promises = [
        chatAPI.getConversations(), // Pour compter les patients (conversations actives)
        eventAPI.getAllEvents(),    // Pour compter mes événements
      ];

      if (isCoach) promises.push(sportAPI.getAllPrograms());
      else promises.push(contentAPI.getArticles(isNutritionist ? 'nutrition' : 'medical'));

      const results = await Promise.all(promises);
      
      const conversations = results[0];
      const allEvents = results[1];
      const myContent = results[2];

      // Filtrer pour ne garder que ce qui appartient au Pro connecté
      const myId = user.id;
      const myEvents = allEvents.filter(e => e.organizer_id === myId || e.organizer?.id === myId);
      // Note: Pour content/sport, l'API renvoie souvent déjà tout, on filtre par sécurité si besoin
      // const myCreations = myContent.filter(c => c.author_id === myId); 

      setStats({
        activePatients: conversations.length,
        eventCount: myEvents.length,
        contentCount: myContent.length // ou myCreations.length
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => { loadDashboard(); }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={themeColor} /></View>;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. HEADER PRO */}
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Espace Pro</Text>
            <Text style={styles.userName}>
              {isDoctor ? 'Dr. ' : ''}{profile?.full_name || "Pro"}
            </Text>
            <View style={styles.badge}>
               <Text style={styles.badgeText}>
                 {isCoach ? 'Coach Sportif' : (isDoctor ? 'Médecin' : 'Nutritionniste')}
               </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
             <Image 
               source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/100' }} 
               style={styles.avatar} 
             />
          </TouchableOpacity>
        </View>

        {/* 2. STATS DASHBOARD (Flottantes) */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: themeColor }]}>{stats.activePatients}</Text>
             <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: themeColor }]}>{stats.contentCount}</Text>
             <Text style={styles.statLabel}>{isCoach ? 'Programmes' : 'Articles'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: themeColor }]}>{stats.eventCount}</Text>
             <Text style={styles.statLabel}>Événements</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        
        {/* 3. ACTIONS RAPIDES */}
        <Text style={styles.sectionTitle}>Gestion Rapide</Text>
        <View style={styles.gridContainer}>

          {/* CRÉER CONTENU (Dynamique selon métier) */}
          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => {
              if (isCoach) navigation.navigate('CreateProgram');
              else navigation.navigate('CreateContent', { category: isNutritionist ? 'nutrition' : 'medical' });
            }}
          >
            <View style={[styles.iconPlaceholder, { backgroundColor: '#E3F2FD' }]}>
               <Ionicons name={isCoach ? "barbell" : "newspaper"} size={28} color="#007AFF" />
            </View>
            <Text style={styles.gridLabel}>
              {isCoach ? 'Nouv. Programme' : 'Nouvel Article'}
            </Text>
          </TouchableOpacity>

          {/* CRÉER ÉVÉNEMENT */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateEvent')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#FFF3E0' }]}>
               <Ionicons name="calendar" size={28} color="#FF9800" />
            </View>
            <Text style={styles.gridLabel}>Créer Event</Text>
          </TouchableOpacity>

          {/* MES PATIENTS (Chat) */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Inbox')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#F3E5F5' }]}>
               <Ionicons name="chatbubbles" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.gridLabel}>Mes Patients</Text>
          </TouchableOpacity>

          {/* MON PROFIL PUBLIC */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Profile')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#E8F5E9' }]}>
               <Ionicons name="person" size={28} color="#34C759" />
            </View>
            <Text style={styles.gridLabel}>Mon Profil</Text>
          </TouchableOpacity>

        </View>

        {/* 4. APERÇU (Liste simple) */}
        <Text style={styles.sectionTitle}>Accès direct</Text>
        
        {isCoach && (
           <TouchableOpacity style={styles.rowLink} onPress={() => navigation.navigate('SportList')}>
             <Ionicons name="list" size={20} color="#666" />
             <Text style={styles.rowText}>Voir tous les programmes</Text>
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
           </TouchableOpacity>
        )}
        
        {!isCoach && (
           <TouchableOpacity style={styles.rowLink} onPress={() => navigation.navigate('ContentList', { category: isNutritionist ? 'nutrition' : 'medical' })}>
             <Ionicons name="library" size={20} color="#666" />
             <Text style={styles.rowText}>Voir mes articles</Text>
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
           </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.rowLink} onPress={() => navigation.navigate('Events')}>
             <Ionicons name="calendar-outline" size={20} color="#666" />
             <Text style={styles.rowText}>Voir le calendrier des événements</Text>
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* BOUTON DÉCONNEXION */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 20, paddingTop: 60, paddingBottom: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#fff' },

  // Stats Card
  statsCard: { 
    position: 'absolute', bottom: -40, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { width: 1, height: '60%', backgroundColor: '#eee' },

  content: { marginTop: 60, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', elevation: 2 },
  iconPlaceholder: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridLabel: { fontWeight: '600', color: '#333', textAlign: 'center' },

  rowLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  rowText: { flex: 1, marginLeft: 15, fontSize: 15, color: '#333' },

  logoutButton: { marginTop: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30', alignItems: 'center' },
  logoutText: { color: '#FF3B30', fontWeight: 'bold' }
});