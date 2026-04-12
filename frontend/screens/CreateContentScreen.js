import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import LottieView from 'lottie-react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { articleAPI } from '../services/api';

export default function CreateArticleScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  
  // États du formulaire
  const [title, setTitle] = useState('');
  
  // ⚠️ CHANGEMENT ICI : On initialise à null pour FORCER le choix
  const [category, setCategory] = useState(null); // 'medical' ou 'nutrition'
  
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null); 

  // 1. Choisir une Image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Accès à la galerie requis.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0]);
    }
  };

  // 2. Envoyer l'article
  const handleSubmit = async () => {
    // ⚠️ VALIDATION OBLIGATOIRE DE LA CATÉGORIE
    if (!category) {
      Alert.alert("Attention", "Veuillez choisir une catégorie (Médical ou Nutrition).");
      return;
    }

    if (!title || !content) {
      Alert.alert("Champs manquants", "Le titre et le contenu sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category); // La valeur sera 'medical' ou 'nutrition'
      formData.append('content', content);

      if (coverImage) {
        const uriParts = coverImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('image', {
          uri: coverImage.uri,
          name: `article_cover.${fileType}`,
          type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
        });
      }

      await articleAPI.createArticle(formData);

      Alert.alert("Succès", "Votre article a été publié !", [
        { text: "Super", onPress: () => navigation.goBack() } 
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de publier l'article.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <LottieView
                // Assure-toi d'avoir une animation ici (ex: write.json ou news.json)
                source={require('../animations/Journalist.json')} 
                autoPlay
                loop
                style={styles.lottie}
            />
            <Text style={styles.headerTitle}>Nouvel Article</Text>
          </View>

          <View style={styles.formCard}>
            
            {/* Titre */}
            <Text style={styles.label}>Titre</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="text" size={20} color="#666" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Titre de l'article..."
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            {/* SÉLECTEUR DE CATÉGORIE OBLIGATOIRE */}
            <Text style={styles.label}>Catégorie <Text style={{color:'red'}}>*</Text></Text>
            <View style={styles.categoryContainer}>
                
                {/* Option MÉDICAL */}
                <TouchableOpacity 
                    style={[
                      styles.catBtn, 
                      category === 'medical' && styles.catBtnActiveMedical
                    ]}
                    onPress={() => setCategory('medical')}
                >
                    <Ionicons 
                      name="medkit" 
                      size={24} 
                      color={category === 'medical' ? '#fff' : '#185a9d'} 
                    />
                    <Text style={[
                      styles.catText, 
                      category === 'medical' && styles.catTextActive
                    ]}>Médical</Text>
                </TouchableOpacity>

                {/* Option NUTRITION */}
                <TouchableOpacity 
                    style={[
                      styles.catBtn, 
                      category === 'nutrition' && styles.catBtnActiveNutrition
                    ]}
                    onPress={() => setCategory('nutrition')}
                >
                    <Ionicons 
                      name="nutrition" 
                      size={24} 
                      color={category === 'nutrition' ? '#fff' : '#43cea2'} 
                    />
                    <Text style={[
                      styles.catText, 
                      category === 'nutrition' && styles.catTextActive
                    ]}>Nutrition</Text>
                </TouchableOpacity>
            </View>
            {/* Petit message d'erreur visuel si aucune catégorie n'est choisie */}
            {!category && (
               <Text style={styles.helperText}>Veuillez sélectionner une catégorie.</Text>
            )}

            {/* Image */}
            <Text style={styles.label}>Image de couverture</Text>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                {coverImage ? (
                <View style={styles.mediaPreview}>
                    <Image source={{ uri: coverImage.uri }} style={styles.previewImage} />
                    <View style={styles.mediaInfo}>
                        <Text style={styles.mediaTextSelected}>Image OK</Text>
                        <Text style={styles.changeText}>Changer</Text>
                    </View>
                </View>
                ) : (
                <View style={styles.mediaPlaceholder}>
                    <Ionicons name="image-outline" size={24} color="#185a9d" />
                    <Text style={styles.mediaText}>Ajouter une image</Text>
                </View>
                )}
            </TouchableOpacity>

            {/* Contenu */}
            <Text style={styles.label}>Contenu</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    multiline
                    placeholder="Écrivez ici..."
                    placeholderTextColor="#999"
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                />
            </View>

            {/* BOUTON VALIDATION */}
            <TouchableOpacity 
                style={[styles.submitButton, !category && styles.submitButtonDisabled]} 
                onPress={handleSubmit} 
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff"/> 
                ) : (
                    <Text style={styles.btnText}>Publier</Text>
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
  scrollContent: { padding: 20, paddingTop: 50 },

  headerContainer: { alignItems: 'center', marginBottom: 20 },
  lottie: { width: 100, height: 100 }, 
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10 },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10
  },

  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#eee',
    paddingHorizontal: 10
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  textAreaWrapper: { alignItems: 'flex-start' },
  textArea: { height: 150, paddingTop: 12 },

  // --- STYLES CATÉGORIE ---
  categoryContainer: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginTop: 5
  },
  catBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 15,
    borderWidth: 2, borderColor: '#F0F0F0', backgroundColor: '#FAFAFA'
  },
  // Couleurs spécifiques pour bien distinguer
  catBtnActiveMedical: {
    backgroundColor: '#185a9d', borderColor: '#185a9d', elevation: 5
  },
  catBtnActiveNutrition: {
    backgroundColor: '#43cea2', borderColor: '#43cea2', elevation: 5
  },
  
  catText: { marginTop: 5, fontWeight: '600', color: '#888' },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  
  helperText: { color: '#e74c3c', fontSize: 12, marginTop: 5, fontStyle: 'italic' },

  // --- Zone Image ---
  mediaButton: { 
    borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, 
    padding: 15, backgroundColor: '#FAFAFA', marginTop: 5 
  },
  mediaPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mediaText: { color: '#666', marginLeft: 10 },
  mediaPreview: { flexDirection: 'row', alignItems: 'center' },
  previewImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  mediaInfo: { marginLeft: 15 },
  mediaTextSelected: { color: '#333', fontWeight: 'bold' },
  changeText: { color: '#185a9d', fontSize: 12 },

  // --- Bouton ---
  submitButton: { 
    backgroundColor: '#185a9d', 
    padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30,
    elevation: 5
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc', // Grisé si pas de catégorie
    elevation: 0
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }
});