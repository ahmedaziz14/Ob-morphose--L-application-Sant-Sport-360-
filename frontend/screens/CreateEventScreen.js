import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventAPI } from '../services/api';

export default function CreateEventScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    max_participants: ''
  });

  const handleSubmit = async () => {
    if (!form.title || !form.location) {
      Alert.alert("Champs manquants", "Le titre et le lieu sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 1);

      await eventAPI.createEvent({
        ...form,
        event_date: eventDate.toISOString(),
        max_participants: form.max_participants ? parseInt(form.max_participants) : 20
      });

      Alert.alert("Succès", "Votre événement a été créé ! 🎉", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de créer l'événement.");
    } finally {
      setLoading(false);
    }
  };

  const animateButton = (toValue) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4
    }).start();
  };

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* --- HEADER AVEC UNIQUEMENT L'ANIMATION (SANS TEXTE) --- */}
          <View style={styles.headerContainer}>
            <LottieView
              source={require('../animations/Event venue.json')} // Remplace par ton fichier
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          {/* --- FORMULAIRE CARD --- */}
          <View style={styles.formCard}>

            {/* Titre */}
            <Text style={styles.label}>Titre de l'événement</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="pricetag-outline" size={20} color="#185a9d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Atelier Yoga, Match de Foot..."
                placeholderTextColor="#aaa"
                value={form.title}
                onChangeText={t => setForm({ ...form, title: t })}
              />
            </View>

            {/* Lieu */}
            <Text style={styles.label}>Lieu ou lien de visioconférence</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#185a9d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Salle A, Google Meet..."
                placeholderTextColor="#aaa"
                value={form.location}
                onChangeText={t => setForm({ ...form, location: t })}
              />
            </View>

            {/* Ligne Date & Participants */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Date (indicative)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#185a9d" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Demain 14h"
                    placeholderTextColor="#aaa"
                    value={form.date}
                    onChangeText={t => setForm({ ...form, date: t })}
                  />
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Max participants</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="people-outline" size={20} color="#185a9d" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="20"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={form.max_participants}
                    onChangeText={t => setForm({ ...form, max_participants: t })}
                  />
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Détails, matériel à apporter, niveau requis..."
                placeholderTextColor="#aaa"
                value={form.description}
                onChangeText={t => setForm({ ...form, description: t })}
                textAlignVertical="top"
              />
            </View>

            {/* BOUTON AVEC ANIMATION */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                onPressIn={() => animateButton(0.96)}
                onPressOut={() => animateButton(1)}
              >
                <LinearGradient
                  colors={['#43cea2', '#185a9d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Créer l'événement</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 30,
  },

  // --- HEADER (uniquement l'animation) ---
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: 140,
    height: 140,
  },

  // --- CARTE FORMULAIRE ---
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  halfInput: {
    width: '48%',
  },

  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },

  // --- BOUTON ---
  submitButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 32,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});