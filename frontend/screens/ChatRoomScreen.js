import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons'; 

import { AuthContext } from '../context/AuthContext';
import { chatAPI } from '../services/api';

const SOCKET_URL = 'http://192.168.1.9:3001'; // ⚠️ Vérifie ton IP locale

export default function ChatRoomScreen({ route, navigation }) {
  const { contactId, contactName } = route.params;
  const { token, user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const socket = useRef(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- 1. CONFIGURATION DU SOCKET ---
  const setupSocket = (convId) => {
    if (socket.current) return;

    socket.current = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    socket.current.on('connect', () => {
      console.log('🟢 Socket connecté, on rejoint la room:', convId);
      socket.current.emit('join_room', convId);
    });

    socket.current.on('receive_message', (msg) => {
      setMessages((prev) => {
        // Remplacement du message optimiste par le message officiel du serveur
        const index = prev.findIndex(m => (m.tempId && m.tempId === msg.tempId) || m.id === msg.id);
        
        if (index !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[index] = msg;
          return updatedMessages;
        }
        
        return [...prev, msg];
      });

      scrollToBottom();
      
      if (msg.sender_id !== user.id) {
        socket.current.emit('mark_as_read', { conversationId: convId });
      }
    });

    // Optionnel : Gérer l'événement global si l'utilisateur est dans le chat mais que l'API REST a été utilisée
    socket.current.on('new_message_notification', (msg) => {
      // Si le message reçu appartient à cette conversation et n'est pas déjà dans la liste
      if (msg.conversation_id === convId) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === msg.id || m.tempId === msg.tempId);
          if (!exists) return [...prev, msg];
          return prev;
        });
        scrollToBottom();
      }
    });

    socket.current.on('user_typing', ({ userId, isTyping }) => {
      if (userId !== user.id) setIsOtherTyping(isTyping);
    });
  };

  // --- 2. INITIALISATION ---
  useEffect(() => {
    navigation.setOptions({ title: contactName || 'Discussion' });

    const initChat = async () => {
      try {
        const data = await chatAPI.getMessages(contactId);
        if (data && data.conversationId) {
          setConversationId(data.conversationId);
          setMessages(data.messages || []);
          setupSocket(data.conversationId);
        }
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger la discussion.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [contactId]);

  // --- 3. ENVOI ---
  const handleSend = () => {
    if (!inputText.trim() || !conversationId) return; 

    const content = inputText.trim();
    const tempId = Date.now().toString();

    const optimisticMessage = {
      id: tempId,
      tempId: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInputText('');
    scrollToBottom();

    if (socket.current) {
      socket.current.emit('send_message', {
        conversationId,
        receiverId: contactId,
        content,
        tempId
      });
    }
  };

  // --- 4. TYPING ET UI ---
  const handleTyping = (text) => {
    setInputText(text);
    if (!socket.current || !conversationId) return;

    socket.current.emit('typing', { conversationId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('typing', { conversationId, isTyping: false });
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === user.id;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>{item.content}</Text>
        <View style={styles.footer}>
          <Text style={[styles.timeText, isMe ? { color: '#E0E0E0' } : { color: '#888' }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && <Ionicons name={item.is_read ? "checkmark-done" : "checkmark"} size={16} color={item.is_read ? "#4DB6AC" : "#E0E0E0"} style={{ marginLeft: 4 }}/>}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

 return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        // 🟢 FIX 1 : Utiliser 'padding' sur iOS, et 'height' ou rien du tout sur Android
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        // Sur Android, on met 0, sur iOS 90 (la hauteur du Header React Navigation)
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
          // 🟢 FIX 2 : S'assurer que la liste scroll en bas quand le clavier s'ouvre
          onLayout={scrollToBottom} 
          ListFooterComponent={isOtherTyping ? <Text style={styles.typingText}>{contactName} est en train d'écrire...</Text> : null}
        />
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            value={inputText} 
            onChangeText={handleTyping} 
            placeholder="Écrivez votre message..." 
            multiline 
            maxLength={500} 
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FB' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20, paddingTop: 10 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 8, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16, lineHeight: 22 },
  myText: { color: '#fff' },
  theirText: { color: '#333' },
  footer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10 },
  typingText: { marginLeft: 15, marginBottom: 10, color: '#888', fontStyle: 'italic', fontSize: 12 },
 inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    // 🟢 MODIFICATION ICI : On force un espace en bas pour ne pas toucher les boutons Android/iOS
    paddingBottom: Platform.OS === 'android' ? 25 : 30, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#EEE' 
  },
  input: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontSize: 16, maxHeight: 100 },
  sendButton: { backgroundColor: '#007AFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#B0C4DE' },
});