import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { userAPI } from '../services/api';

export default function PublicProfileScreen({ route, navigation }) {
  const { userId } = route.params; // L'ID reçu depuis la liste
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userAPI.getPublicProfile(userId);
        setUser(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{flex:1}} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* Avatar */}
        <Image 
          source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }} 
          style={styles.avatar} 
        />
        <Text style={styles.name}>{user?.full_name}</Text>
        
        {/* Badge Rôle */}
        <View style={[styles.badge, user?.role === 'doctor' ? styles.badgeRed : styles.badgeBlue]}>
          <Text style={styles.badgeText}>
            {user?.role === 'doctor' ? 'Médecin' : 'Coach Sportif'}
          </Text>
        </View>

        <Text style={styles.bio}>
          {user?.bio || "Aucune biographie disponible pour ce professionnel."}
        </Text>

        {/* Bouton Message */}
       <TouchableOpacity 
  style={styles.messageButton}
  onPress={() => {
    // ✅ C'EST LE MOMENT !
    navigation.navigate('ChatRoom', { 
      contactId: user.id,      // ID du médecin/coach
      contactName: user.full_name // Son nom pour le titre
    });
  }}
>
  <Text style={styles.messageButtonText}>💬 Envoyer un message</Text>
</TouchableOpacity>
      </View>

      {/* Section Stats ou Infos supplémentaires */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Spécialité</Text>
        <Text style={styles.infoText}>{user?.specialty || "Généraliste"}</Text>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Contact</Text>
        <Text style={styles.infoText}>{user?.email}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#F9FAFB' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  badge: { marginTop: 10, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  badgeRed: { backgroundColor: '#FFEBEE' }, 
  badgeBlue: { backgroundColor: '#E3F2FD' },
  badgeText: { fontWeight: 'bold', color: '#333' },

  bio: { textAlign: 'center', marginTop: 15, color: '#666', fontStyle: 'italic', paddingHorizontal: 20 },
  
  messageButton: {
    marginTop: 25, backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 12,
    borderRadius: 25, elevation: 3
  },
  messageButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  infoSection: { padding: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  infoText: { fontSize: 16, color: '#555' }
});