import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Keyboard, StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionAPI } from '../services/api';

export default function NutritionScreen({ navigation }) {
  // 'scan' = Photo (Gemini), 'text' = Recherche (API Ninjas)
  const [mode, setMode] = useState('scan'); 
  
  const [query, setQuery] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // --- LOGIQUE PHOTO ---
  const pickImage = async (useCamera = false) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erreur", "Permission refusée.");

    let resultPicker;
    if (useCamera) {
        resultPicker = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true });
    } else {
        resultPicker = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true });
    }

    if (!resultPicker.canceled) {
      setImage(resultPicker.assets[0].uri);
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!image) return Alert.alert("Erreur", "Veuillez sélectionner une image.");
    setLoading(true);
    try {
      const data = await nutritionAPI.scanFoodImage(image);
      setResult(data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'analyser l'image.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE TEXTE ---
  const handleSearch = async () => {
    if (!query.trim()) return Alert.alert("Erreur", "Champ vide.");
    Keyboard.dismiss();
    setLoading(true);
    try {
      const data = await nutritionAPI.searchFoodText(query);
      setResult(data);
    } catch (err) {
      Alert.alert("Introuvable", "Essayez en anglais (ex: '2 eggs').");
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
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER ANIMÉ */}
        <View style={styles.headerContainer}>
          <LottieView
            // Assure-toi d'avoir une animation 'Nutrition.json' dans assets/animations
            source={require('../animations/Nutrition.json')} 
            autoPlay loop style={styles.lottie}
          />
          <Text style={styles.headerTitle}>Nutrition AI</Text>
        </View>

        {/* --- ONGLETS (Tabs) --- */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, mode === 'scan' && styles.activeTab]} 
            onPress={() => { setMode('scan'); setResult(null); }}
          >
            <Ionicons name="camera" size={20} color={mode === 'scan' ? '#185a9d' : '#fff'} />
            <Text style={[styles.tabText, mode === 'scan' && styles.activeTabText]}>Scan Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, mode === 'text' && styles.activeTab]} 
            onPress={() => { setMode('text'); setResult(null); }}
          >
            <Ionicons name="search" size={20} color={mode === 'text' ? '#185a9d' : '#fff'} />
            <Text style={[styles.tabText, mode === 'text' && styles.activeTabText]}>Recherche</Text>
          </TouchableOpacity>
        </View>

        {/* --- ZONE D'ACTION --- */}
        <View style={styles.card}>
            
            {/* 📸 MODE SCAN */}
            {mode === 'scan' && (
                <View style={{width: '100%', alignItems: 'center'}}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="image-outline" size={50} color="#ccc" />
                            <Text style={{color:'#999', marginTop: 10}}>Aucune image</Text>
                        </View>
                    )}

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(true)}>
                            <Ionicons name="camera" size={24} color="#185a9d" />
                            <Text style={styles.iconText}>Caméra</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(false)}>
                            <Ionicons name="images" size={24} color="#185a9d" />
                            <Text style={styles.iconText}>Galerie</Text>
                        </TouchableOpacity>
                    </View>

                    {image && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleScan} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🔍 Analyser (Gemini)</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ✍️ MODE TEXTE */}
            {mode === 'text' && (
                <View style={{width: '100%'}}>
                    <Text style={styles.label}>Décrivez votre repas (En Anglais)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex: 100g chicken and rice"
                        value={query}
                        onChangeText={setQuery}
                    />
                    <TouchableOpacity style={styles.actionButton} onPress={handleSearch} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🚀 Calculer (API Ninjas)</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* --- RÉSULTATS --- */}
        {result && (
            <View style={styles.resultCard}>
                <Text style={styles.foodTitle}>{result.name || "Aliment détecté"}</Text>
                {result.message && <Text style={styles.foodMsg}>{result.message}</Text>}

                <View style={styles.caloriesBox}>
                    <Ionicons name="flame" size={28} color="#FF5722" />
                    <Text style={styles.calValue}>{Math.round(result.calories)}</Text>
                    <Text style={styles.calUnit}>Kcal</Text>
                </View>

                <View style={styles.macrosRow}>
                    <MacroItem label="Protéines" value={result.protein} color="#4CAF50" />
                    <MacroItem label="Glucides" value={result.carbs} color="#FFC107" />
                    <MacroItem label="Lipides" value={result.fat} color="#2196F3" />
                </View>

                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => Alert.alert("Succès", "Repas ajouté au journal !")}
                >
                    <Text style={styles.addBtnText}>+ Ajouter au Journal</Text>
                </TouchableOpacity>
            </View>
        )}

        <View style={{height: 50}} />
      </ScrollView>
    </LinearGradient>
  );
}

// Petit composant réutilisable pour afficher les macros
const MacroItem = ({ label, value, color }) => (
    <View style={styles.macroBox}>
        <Text style={[styles.macroVal, { color }]}>{Math.round(value)}g</Text>
        <Text style={styles.macroLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 50, alignItems: 'center' },

  headerContainer: { alignItems: 'center', marginBottom: 20 },
  lottie: { width: 100, height: 100 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10 },

  // Tabs (Onglets)
  tabContainer: { 
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 15, padding: 5, marginBottom: 20, width: '100%' 
  },
  tab: { 
    flex: 1, flexDirection: 'row', paddingVertical: 10, 
    justifyContent: 'center', alignItems: 'center', borderRadius: 10 
  },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  activeTabText: { color: '#185a9d' },

  // Carte Principale
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 25, padding: 20,
    elevation: 8, alignItems: 'center', marginBottom: 20
  },
  
  // Scan UI
  previewImage: { width: '100%', height: 200, borderRadius: 15 },
  placeholder: { 
    width: '100%', height: 150, borderRadius: 15, backgroundColor: '#f0f0f0', 
    justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' 
  },
  btnRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 15 },
  iconBtn: { alignItems: 'center' },
  iconText: { fontSize: 12, color: '#185a9d', marginTop: 5, fontWeight: '600' },

  // Text UI
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10, alignSelf: 'flex-start' },
  input: { 
    backgroundColor: '#F5F5F5', width: '100%', padding: 15, borderRadius: 10, 
    borderWidth: 1, borderColor: '#eee', marginBottom: 15 
  },

  // Bouton d'action
  actionButton: {
    backgroundColor: '#185a9d', width: '100%', padding: 15, borderRadius: 15, 
    alignItems: 'center', marginTop: 15
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Carte Résultat
  resultCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 25, padding: 20,
    elevation: 8, alignItems: 'center'
  },
  foodTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textTransform: 'capitalize' },
  foodMsg: { color: '#666', fontStyle: 'italic', marginBottom: 15, textAlign: 'center' },
  
  caloriesBox: { 
    flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#FFF3E0', 
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20 
  },
  calValue: { fontSize: 30, fontWeight: 'bold', color: '#E65100', marginRight: 5 },
  calUnit: { fontSize: 16, color: '#E65100' },

  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  macroBox: { alignItems: 'center', flex: 1 },
  macroVal: { fontSize: 18, fontWeight: 'bold' },
  macroLabel: { fontSize: 12, color: '#999' },

  addButton: {
    backgroundColor: '#43cea2', width: '100%', padding: 12, borderRadius: 15, alignItems: 'center'
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' }
});