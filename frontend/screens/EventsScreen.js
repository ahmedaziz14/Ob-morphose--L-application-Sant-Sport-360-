import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StatusBar, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Le Thème
import LottieView from 'lottie-react-native'; // ✅ L'animation
import { Ionicons } from '@expo/vector-icons';

import { eventAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function EventsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const animation = useRef(null);
  
  const [events, setEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Vérification Rôle
  const isAdminOrPro = user?.role === 'admin' || user?.role === 'professionnel' || user?.role === 'doctor' || user?.role === 'medecin' || user?.role === 'coach';

  useEffect(() => {
    loadData();
  }, []);

  // --- 1. CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    try {
      const [allEvents, myRegistrations] = await Promise.all([
        eventAPI.getAllEvents(),
        eventAPI.getMyRegistrations()
      ]);

      // Tri par date (du plus proche au plus loin)
      const sortedEvents = allEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      
      setEvents(sortedEvents);
      
      const myIds = myRegistrations.map(evt => evt.id);
      setRegisteredEventIds(myIds);

    } catch (error) {
      console.error(error);
      // Alert.alert("Erreur", "Impossible de charger les événements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- 2. GESTION INSCRIPTION ---
  const handleRegister = async (event) => {
    if (event.current_participants >= event.max_participants) {
      Alert.alert("Complet", "Le nombre maximal de participants est atteint.");
      return;
    }

    try {
      await eventAPI.register(event.id);
      Alert.alert("Félicitations ! 🎉", "Vous êtes inscrit à cet événement.");
      
      // Mise à jour Optimiste
      setRegisteredEventIds(prev => [...prev, event.id]);
      setEvents(prevEvents => prevEvents.map(evt => {
        if (evt.id === event.id) {
          return { ...evt, current_participants: evt.current_participants + 1 };
        }
        return evt;
      }));

    } catch (error) {
      Alert.alert("Erreur", "Impossible de s'inscrire.");
    }
  };

  // --- 3. HEADER LISTE (Animation) ---
  const ListHeader = () => (
    <View style={styles.headerContainer}>
        <View style={styles.lottieWrapper}>
            <LottieView
                // ⚠️ Assure-toi d'avoir un fichier json ici (ex: Calendar.json)
                source={require('../animations/Event venue.json')} 
                autoPlay
                loop
                style={styles.lottie}
            />
        </View>
        <Text style={styles.headerTitle}>Événements & Ateliers</Text>
        <Text style={styles.headerSubtitle}>Rejoignez la communauté !</Text>
    </View>
  );

  // --- 4. RENDU CARTE ---
  const renderEventItem = ({ item }) => {
    const isRegistered = registeredEventIds.includes(item.id);
    const isFull = item.current_participants >= item.max_participants;
    
    // Formatage Date : "Jeu. 14 Oct • 14:00"
    const dateObj = new Date(item.event_date);
    const day = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        {/* En-tête Carte */}
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
             <Text style={styles.dateDay}>{dateObj.getDate()}</Text>
             <Text style={styles.dateMonth}>{dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color="#666" />
                <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>
        </View>

        {/* Description & Infos */}
        <View style={styles.cardBody}>
            <Text style={styles.eventDescription} numberOfLines={3}>{item.description}</Text>
            
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#185a9d" />
                    <Text style={styles.metaText}>{time}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={16} color="#185a9d" />
                    <Text style={[styles.metaText, isFull && styles.textFull]}>
                        {item.current_participants}/{item.max_participants}
                    </Text>
                </View>
            </View>

            {item.organizer && (
                <Text style={styles.organizerText}>
                    Organisé par <Text style={{fontWeight: 'bold'}}>{item.organizer.full_name}</Text>
                </Text>
            )}
        </View>

        {/* Bouton Action */}
        {!isAdminOrPro && (
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isRegistered ? styles.btnRegistered : (isFull ? styles.btnFull : styles.btnNormal)
              ]} 
              onPress={() => {
                if (!isRegistered && !isFull) handleRegister(item);
              }}
              disabled={isRegistered || isFull}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.btnText, 
                (isRegistered || isFull) ? styles.textDisabled : {}
              ]}>
                {isRegistered ? "✅  Inscrit" : (isFull ? "🔒  Complet" : "Je participe")}
              </Text>
            </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return (
    <LinearGradient colors={['#43cea2', '#185a9d']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
    </LinearGradient>
  );

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']} // ✅ Thème
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEventItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={50} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>Aucun événement prévu pour le moment.</Text>
            </View>
        }
      />

      {/* FAB (Bouton Flottant) pour Admin/Pro */}
      {isAdminOrPro && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Ionicons name="add" size={32} color="#185a9d" />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContent: { 
    padding: 20, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 100 
  },

  // --- Header ---
  headerContainer: { alignItems: 'center', marginBottom: 25 },
  lottieWrapper: { 
      width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.2)', 
      borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  lottie: { width: 120, height: 120 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 4 },

  // --- Carte Événement ---
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, padding: 15,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5
  },
  
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  
  // Badge Date (Carré à gauche)
  dateBadge: {
      backgroundColor: '#f0f4f8', borderRadius: 12, width: 55, height: 55,
      justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  dateDay: { fontSize: 20, fontWeight: 'bold', color: '#185a9d' },
  dateMonth: { fontSize: 11, fontWeight: '600', color: '#666' },

  titleContainer: { flex: 1, justifyContent: 'center' },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  eventLocation: { fontSize: 13, color: '#666', marginLeft: 4 },

  cardBody: { marginTop: 5 },
  eventDescription: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 15 },

  // Métadonnées (Heure, Participants)
  metaRow: { flexDirection: 'row', marginBottom: 15 },
  metaItem: { 
      flexDirection: 'row', alignItems: 'center', marginRight: 20,
      backgroundColor: '#f5f7fa', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8
  },
  metaText: { fontSize: 13, color: '#333', marginLeft: 6, fontWeight: '600' },
  textFull: { color: '#e74c3c' },

  organizerText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginBottom: 15 },

  // Bouton Action
  actionButton: {
      paddingVertical: 14, borderRadius: 12, alignItems: 'center',
      borderWidth: 1, borderColor: 'transparent'
  },
  btnNormal: { backgroundColor: '#185a9d' }, // Bleu thème
  btnRegistered: { backgroundColor: '#fff', borderColor: '#43cea2' }, // Blanc bordure verte
  btnFull: { backgroundColor: '#f0f0f0', borderColor: '#ddd' }, // Gris

  btnText: { fontWeight: 'bold', fontSize: 15, color: '#fff' },
  textDisabled: { color: '#999' }, // Texte gris si désactivé
  
  // Surcharge couleur texte bouton "Inscrit"
  btnRegisteredText: { color: '#43cea2' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.8 },
  emptyText: { color: '#fff', fontSize: 16, marginTop: 10 },

  // FAB
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 6
  }
});