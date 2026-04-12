import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Important pour rafraîchir au retour
import { chatAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns'; // Optionnel (npm install date-fns) ou utiliser JS natif

export default function InboxScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' ou 'contacts'
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données
  const fetchData = async () => {
    try {
      // On charge les deux listes en parallèle
      const [convsData, contactsData] = await Promise.all([
        chatAPI.getConversations(),
        chatAPI.getContacts()
      ]);
      setConversations(convsData);
      setContacts(contactsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useFocusEffect permet de recharger la liste quand on revient de la ChatRoom
  // (pour mettre à jour le dernier message affiché)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- NAVIGATION VERS LE CHAT ---
  const openChat = (item, isNewContact = false) => {
    // Si c'est une conversation existante, l'info du contact est dans item.contact
    // Si c'est un nouveau contact, l'info est directement dans item
    const targetId = isNewContact ? item.id : item.contact.id;
    const targetName = isNewContact ? item.full_name : item.contact.full_name;

    navigation.navigate('ChatRoom', {
      contactId: targetId,
      contactName: targetName
    });
  };

  // --- RENDU D'UNE CONVERSATION ---
  const renderConversation = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item, false)}>
      <Image 
        source={{ uri: item.contact?.avatar_url || 'https://via.placeholder.com/150' }} 
        style={styles.avatar} 
      />
      <View style={styles.textContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.contact?.full_name || "Utilisateur Inconnu"}</Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || "Nouvelle discussion"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // --- RENDU D'UN CONTACT (Docteur/Coach) ---
  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item, true)}>
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }} 
        style={styles.avatar} 
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.full_name}</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, item.role === 'doctor' ? styles.badgeDoctor : styles.badgeCoach]}>
            <Text style={styles.badgeText}>
              {item.role === 'doctor' ? 'Médecin' : 'Coach'}
            </Text>
          </View>
          <Text style={styles.specialty}>{item.specialty}</Text>
        </View>
      </View>
      <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Messagerie</Text>

      {/* --- ONGLETS (Tabs) --- */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'conversations' && styles.activeTab]} 
          onPress={() => setActiveTab('conversations')}
        >
          <Text style={[styles.tabText, activeTab === 'conversations' && styles.activeTabText]}>
            Discussions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'contacts' && styles.activeTab]} 
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>
            Nouveaux Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- LISTE --- */}
      {activeTab === 'conversations' ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Aucune conversation.</Text>
              <Text style={styles.emptySubText}>Allez dans l'onglet "Nouveaux Contacts" pour commencer.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun contact disponible.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15, color: '#333' },

  // Tabs
  tabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#E9ECEF', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#007AFF' },

  // Card items
  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  textContainer: { flex: 1, marginLeft: 15 },
  
  // Styles Conversation
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  lastMessage: { fontSize: 14, color: '#666' },

  // Styles Contact
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  badgeDoctor: { backgroundColor: '#FFEBEE' },
  badgeCoach: { backgroundColor: '#E3F2FD' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  specialty: { fontSize: 12, color: '#666', fontStyle: 'italic' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 50, padding: 20 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 10 },
  emptySubText: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 5 }
});