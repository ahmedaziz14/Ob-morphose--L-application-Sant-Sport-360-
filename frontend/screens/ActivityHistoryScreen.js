import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Pour recharger quand on vient du profil
import { activityAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns'; // Si tu as date-fns, sinon on utilise JS natif (voir plus bas)
import { fr } from 'date-fns/locale'; // Pour la date en français

export default function ActivityHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger l'historique
  const loadHistory = async () => {
    try {
      const data = await activityAPI.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Erreur historique:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recharge automatique quand on arrive sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item }) => {
    // Formatage de la date (JS Natif pour éviter les dépendances si tu n'as pas date-fns)
    const dateObj = new Date(item.completed_at);
    const dateStr = dateObj.toLocaleDateString('fr-FR', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    });
    const timeStr = dateObj.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', minute: '2-digit' 
    });

    // Gestion de la difficulté pour la couleur du badge
    const difficulty = item.program?.difficulty || 'Moyen';
    let badgeColor = '#E3F2FD'; // Bleu clair (défaut)
    let textColor = '#007AFF';

    if (difficulty === 'Facile') { badgeColor = '#E8F5E9'; textColor = '#2E7D32'; } // Vert
    if (difficulty === 'Difficile') { badgeColor = '#FFEBEE'; textColor = '#C62828'; } // Rouge

    return (
      <View style={styles.card}>
        
        {/* EN-TÊTE DE LA CARTE */}
        <View style={styles.cardHeader}>
          <View>
             <Text style={styles.programTitle}>
               {item.program?.title || "Séance Libre"}
             </Text>
             <Text style={styles.dateText}>
               {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} à {timeStr}
             </Text>
          </View>
          
          {/* Badge de Difficulté */}
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>
              {difficulty}
            </Text>
          </View>
        </View>

        {/* LIGNE DE SÉPARATION */}
        <View style={styles.divider} />

        {/* STATS (Durée & Calories) */}
        <View style={styles.statsRow}>
          
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="flame" size={18} color="#FF9500" />
            </View>
            <View>
              <Text style={styles.statValue}>{item.calories_burned} kcal</Text>
              <Text style={styles.statLabel}>Brûlées</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="time" size={18} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.statValue}>{item.duration_minutes} min</Text>
              <Text style={styles.statLabel}>Durée</Text>
            </View>
          </View>

        </View>

        {/* FEEDBACK (Si présent) */}
        {item.feedback && (
          <View style={styles.feedbackContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color="#666" style={{ marginTop: 2 }} />
            <Text style={styles.feedbackText}>"{item.feedback}"</Text>
          </View>
        )}

      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Titre de l'écran */}
      <Text style={styles.headerTitle}>Historique des séances</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Pas encore de séance terminée.</Text>
            <Text style={styles.emptySubText}>Commencez un programme pour remplir votre historique !</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerTitle: { 
    fontSize: 24, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#333' 
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

  // --- CARTE ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  
  cardHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' 
  },
  programTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  dateText: { fontSize: 13, color: '#999', textTransform: 'capitalize' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

  // --- STATS ---
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  iconCircle: { 
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 
  },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999' },

  // --- FEEDBACK ---
  feedbackContainer: { 
    flexDirection: 'row', marginTop: 15, backgroundColor: '#FAFAFA', 
    padding: 10, borderRadius: 8, alignItems: 'flex-start' 
  },
  feedbackText: { marginLeft: 8, fontSize: 13, color: '#555', fontStyle: 'italic', flex: 1 },

  // --- VIDE ---
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center' }
});