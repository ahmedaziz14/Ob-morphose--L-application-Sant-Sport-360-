import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Import du dégradé
import { sportAPI } from '../services/api';

export default function CreateProgramScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'debutant',
    duration: '45'
  });

  const difficultyOptions = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'adapte_faiblesse', label: 'Adapté / Rééducation' },
  ];

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le programme
      const response = await sportAPI.createProgram(form);
      
      // ✅ Récupération de l'ID (Ta correction est bien conservée ici)
      const createdProgram = response.program; 

      Alert.alert(
        "Succès", 
        "Programme créé ! Ajoutez maintenant des exercices.",
        [
          { 
            text: "C'est parti !", 
            onPress: () => navigation.replace('AddExercise', { programId: createdProgram.id }) 
          }
        ]
      );

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de créer le programme.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']} // Le thème de l'app
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* --- EN-TÊTE : LOGO & TITRE --- */}
          <View style={styles.headerContainer}>
            <Image 
                source={require('../animations/Logo svg.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Nouveau Programme</Text>
            <Text style={styles.headerSubtitle}>Créez une routine pour vos patients</Text>
          </View>

          {/* --- CARTE FORMULAIRE (Fond Blanc) --- */}
          <View style={styles.formCard}>

            {/* TITRE */}
            <Text style={styles.label}>Titre du Programme</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Abdos en béton 30j"
              placeholderTextColor="#999"
              value={form.title}
              onChangeText={t => setForm({...form, title: t})}
            />

            {/* DURÉE */}
            <Text style={styles.label}>Durée moyenne (min)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric"
              placeholder="45"
              placeholderTextColor="#999"
              value={form.duration}
              onChangeText={t => setForm({...form, duration: t})}
            />

            {/* DIFFICULTÉ */}
            <Text style={styles.label}>Niveau de difficulté</Text>
            <View style={styles.difficultyContainer}>
              {difficultyOptions.map((option) => (
                <TouchableOpacity 
                  key={option.value}
                  style={[
                    styles.difficultyButton, 
                    form.difficulty === option.value && styles.difficultyButtonActive
                  ]}
                  onPress={() => setForm({...form, difficulty: option.value})}
                >
                  <Text style={[
                    styles.difficultyText, 
                    form.difficulty === option.value && styles.difficultyTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DESCRIPTION */}
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              multiline 
              placeholder="Objectifs, matériel nécessaire, conseils..."
              placeholderTextColor="#999"
              value={form.description}
              onChangeText={t => setForm({...form, description: t})}
            />

            {/* BOUTON VALIDATION */}
            <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff"/> 
              ) : (
                <Text style={styles.btnText}>Suivant : Ajouter Exercices</Text>
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
  logo: { width: 80, height: 80, marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },

  // --- Carte Blanche ---
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10, // Ombre Android
  },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  
  input: { 
    backgroundColor: '#F5F5F5', // Gris très clair
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16,
    color: '#333'
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  // --- Difficulté ---
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 5
  },
  difficultyButtonActive: {
    backgroundColor: '#E3F2FD', 
    borderColor: '#185a9d', // Bleu du thème
  },
  difficultyText: {
    color: '#666',
    fontSize: 13,
  },
  difficultyTextActive: {
    color: '#185a9d',
    fontWeight: 'bold',
  },

  // --- Bouton Principal ---
  btn: { 
    backgroundColor: '#185a9d', // Bleu du thème
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 30,
    shadowColor: "#185a9d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase' }
});