import React, { useState, useContext, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator, Image 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Import du dégradé
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const animation = useRef(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result && !result.success) {
        Alert.alert('Echec de connexion', result.msg || "Identifiants incorrects");
        setLoading(false); 
      } 
      // Si succès, AppNavigator gère la transition
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Une erreur réseau est survenue");
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
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 1. LOGO DE L'APP */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../animations/Logo svg.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* 2. ANIMATION (Optionnelle, on peut la garder ou l'enlever pour gagner de la place) */}
          <View style={styles.lottieContainer}>
            <LottieView
              autoPlay
              ref={animation}
              style={{ width: 150, height: 150 }} // Un peu plus petit pour laisser de la place au logo
              source={require('../animations/Login (1).json')} 
            />
          </View>

          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre espace santé</Text>

          {/* FORMULAIRE */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
          </View>

          {/* BOUTON : Blanc pour ressortir sur le fond bleu */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#185a9d" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              Pas encore de compte ? <Text style={styles.linkBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, // Le LinearGradient prend tout l'espace
  keyboardView: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    paddingTop: 60 // Pour éviter que le logo tape en haut sur certains téléphones
  },
  
  logoContainer: {
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
  },

  lottieContainer: { alignItems: 'center', marginBottom: 10 },
  
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', // Blanc pour le contraste
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#e0e0e0', // Gris très clair
    marginBottom: 30 
  },
  
  inputContainer: { width: '100%', marginBottom: 10 },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Blanc légèrement transparent ou solide
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3, // Ombre Android
    shadowColor: "#000", // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    padding: 15,
    color: '#333',
    fontSize: 16,
  },
  
  button: {
    backgroundColor: '#fff', // Bouton Blanc
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    height: 55,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { 
    color: '#185a9d', // Texte Bleu (couleur du thème)
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  
  linkText: { color: '#f0f0f0', fontSize: 15 },
  linkBold: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' },
});