import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../services/api';
import { io } from 'socket.io-client';

// ✅ UTILISE LA MÊME IP PARTOUT
const SOCKET_URL = 'http://192.168.1.9:3001';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const socketRef = useRef(null);

  // --- FETCH INITIAL ---
  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Erreur chargement notifications :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // --- SOCKET TEMPS RÉEL ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log("✅ Socket connecté (NotificationsScreen)");
    });

    socketRef.current.on('new_notification', (data) => {
      console.log("📩 Nouvelle notif reçue :", data);

      // ✅ AJOUT DIRECT + éviter doublons
      setNotifications(prev => {
        const exists = prev.some(n => n.id === data.id);
        if (exists) return prev;

        return [data, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // --- REFRESH MANUEL ---
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // --- CLICK NOTIFICATION ---
  const handlePressNotification = async (item) => {
    if (!item.is_read) {
      try {
        await notificationAPI.markAsRead(item.id);

        setNotifications(prev => 
          prev.map(n => n.id === item.id ? { ...n, is_read: 1 } : n)
        );
      } catch (e) {
        console.error("Erreur markAsRead:", e);
      }
    }

    // Navigation
    if (item.type === 'event') {
      navigation.navigate('Events');
    } else if (item.type === 'article') {
      navigation.navigate('ContentList', { category: 'medical' }); 
    } else if (item.type === 'program') {
      navigation.navigate('SportListStack');
    }
  };

  // --- MARK ALL READ ---
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Erreur markAllAsRead:", error);
    }
  };

  // --- ICONS ---
  const getIconData = (type) => {
    switch (type) {
      case 'event': return { name: 'calendar', color: '#0A84FF', bg: '#E5F1FF' };
      case 'program': return { name: 'barbell', color: '#FF9500', bg: '#FFF4E5' };
      case 'article': return { name: 'newspaper', color: '#34C759', bg: '#EAF8ED' };
      default: return { name: 'notifications', color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  // --- ITEM ---
  const renderItem = ({ item }) => {
    const iconData = getIconData(item.type);
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity 
        style={[styles.card, isUnread && styles.cardUnread]} 
        activeOpacity={0.7}
        onPress={() => handlePressNotification(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
          <Ionicons name={iconData.name} size={24} color={iconData.color} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, isUnread && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
            })}
          </Text>
        </View>

        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // --- LOADING ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // --- UI ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.readAllButton}>
            <Ionicons name="checkmark-done" size={18} color="#007AFF" />
            <Text style={styles.readAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#C7C7CC" />
            <Text style={styles.emptyText}>Vous n'avez aucune notification.</Text>
          </View>
        }
      />
    </View>
  );
}

// --- STYLES (inchangés) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },

  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readAllText: { color: '#007AFF', marginLeft: 4 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardUnread: { backgroundColor: '#F8FBFF' },

  iconContainer: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },

  textContainer: { flex: 1 },

  title: { fontSize: 16, fontWeight: '600' },
  titleUnread: { fontWeight: 'bold' },

  message: { fontSize: 14, color: '#666' },

  time: { fontSize: 12, color: '#999', marginTop: 6 },

  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#007AFF'
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: { marginTop: 15, color: '#999' }
});