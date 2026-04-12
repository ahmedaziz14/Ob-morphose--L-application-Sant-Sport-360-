import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Le fond Dégradé
import LottieView from 'lottie-react-native'; // ✅ L'animation
import { Ionicons } from '@expo/vector-icons';
import { sportAPI } from '../services/api';

export default function AddExerciseScreen({ route, navigation }) {
  const { programId } = route.params; 

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState('');
  const [media, setMedia] = useState(null); 
  const [loading, setLoading] = useState(false);

  // 1. Choisir Média
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  // 2. Envoyer
  const handleSubmit = async () => {
    if (!title || !instructions) {
      Alert.alert("Erreur", "Titre et consignes obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const exerciseData = {
        title,
        instructions,
        duration_minutes: duration || 0,
        order_index: 1 
      };

      await sportAPI.addExercise(programId, exerciseData, media);

      Alert.alert("Succès", "Exercice ajouté au programme !", [
        { text: "Super", onPress: () => navigation.goBack() } 
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'ajouter l'exercice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']} // ✅ Même thème
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* --- EN-TÊTE ANIMÉ --- */}
          <View style={styles.headerContainer}>
            <LottieView
                // ⚠️ Mets ici le nom de ton fichier JSON (ex: gym.json)
                source={require('../animations/Swimming.json')} 
                autoPlay
                loop
                style={styles.lottie}
            />
            <Text style={styles.headerTitle}>Nouvel Exercice</Text>
            <Text style={styles.headerSubtitle}>Enrichissez votre programme</Text>
          </View>

          {/* --- CARTE FORMULAIRE --- */}
          <View style={styles.formCard}>
            
            {/* Titre */}
            <Text style={styles.label}>Nom de l'exercice</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="barbell-outline" size={20} color="#666" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Ex: Squats sautés"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            {/* Durée */}
            <Text style={styles.label}>Durée ou Répétitions</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="timer-outline" size={20} color="#666" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Ex: 45 secondes / 15 reps"
                    placeholderTextColor="#999"
                    value={duration}
                    onChangeText={setDuration}
                />
            </View>

            {/* Consignes */}
            <Text style={styles.label}>Consignes & Détails</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    multiline
                    placeholder="Dos droit, descendez jusqu'à l'horizontale..."
                    placeholderTextColor="#999"
                    value={instructions}
                    onChangeText={setInstructions}
                />
            </View>

            {/* ZONE UPLOAD MÉDIA */}
            <Text style={styles.label}>Démonstration (Vidéo/Image)</Text>
            <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                {media ? (
                <View style={styles.mediaPreview}>
                    <Ionicons name="checkmark-circle" size={28} color="#43cea2" />
                    <View style={{marginLeft: 10}}>
                        <Text style={styles.mediaTextSelected}>Fichier sélectionné !</Text>
                        <Text style={styles.mediaSubText}>Appuyez pour changer</Text>
                    </View>
                </View>
                ) : (
                <View style={styles.mediaPlaceholder}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="cloud-upload-outline" size={28} color="#185a9d" />
                    </View>
                    <Text style={styles.mediaText}>Ajouter une photo ou vidéo</Text>
                </View>
                )}
            </TouchableOpacity>

            {/* BOUTON VALIDATION */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff"/> 
                ) : (
                    <Text style={styles.btnText}>Valider et Ajouter</Text>
                )}
            </TouchableOpacity>

          </View>
          
          <View style={{height: 50}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 40 },

  // --- Header ---
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  lottie: { width: 120, height: 120 }, // Taille de l'animation
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: -10 },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },

  // --- Carte Formulaire ---
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  
  // Inputs avec Icône
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 10
  },
  icon: { marginRight: 5 },
  input: { 
    flex: 1, paddingVertical: 12, fontSize: 16, color: '#333'
  },
  textAreaWrapper: { alignItems: 'flex-start' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },

  // --- Zone Média ---
  mediaButton: { 
    borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: 15, 
    padding: 20, alignItems: 'center', backgroundColor: '#FAFAFA', marginTop: 5 
  },
  mediaPlaceholder: { alignItems: 'center' },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  mediaPreview: { flexDirection: 'row', alignItems: 'center' },
  mediaText: { color: '#666', fontWeight: '500' },
  mediaTextSelected: { color: '#43cea2', fontWeight: 'bold', fontSize: 16 },
  mediaSubText: { color: '#999', fontSize: 12 },

  // --- Bouton ---
  submitButton: { 
    backgroundColor: '#185a9d', // Bleu fort
    padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30,
    shadowColor: "#185a9d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }
});