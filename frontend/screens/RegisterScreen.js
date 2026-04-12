import React, { useState, useContext, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ScrollView, Image, ActivityIndicator 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // ✅ Rôle par défaut : Patient
  const [role, setRole] = useState('patient'); 
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const animation = useRef(null);

  // Liste des rôles disponibles pour l'interface
  const roles = [
    { key: 'patient', label: 'Patient', icon: 'person' },
    { key: 'coach', label: 'Coach Sportif', icon: 'barbell' },
    { key: 'medecin', label: 'Médecin', icon: 'medkit' },
    { key: 'nutritionist', label: 'Nutritionniste', icon: 'nutrition' },
  ];

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    // On passe le rôle choisi (ex: 'coach') directement
    const result = await register(email, password, role, fullName);
    
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Succès", 
        "Compte créé avec succès ! Connectez-vous maintenant.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Erreur', result.msg || "Une erreur est survenue.");
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
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../animations/Logo svg.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez notre communauté santé</Text>

          {/* --- SÉLECTEUR DE RÔLE (GRID 2x2) --- */}
          <Text style={styles.sectionLabel}>Je suis :</Text>
          <View style={styles.roleGrid}>
            {roles.map((r) => (
              <TouchableOpacity 
                key={r.key}
                style={[
                  styles.roleButton, 
                  role === r.key && styles.roleButtonActive
                ]} 
                onPress={() => setRole(r.key)}
              >
                <Ionicons 
                  name={r.icon} 
                  size={24} 
                  color={role === r.key ? '#185a9d' : '#fff'} 
                />
                <Text style={[
                  styles.roleText, 
                  role === r.key && styles.roleTextActive
                ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* ------------------------- */}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Nom complet"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
            </View>

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

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#185a9d" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              Déjà membre ? <Text style={styles.linkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  
  // ✅ C'EST ICI QUE CA SE JOUE
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 120 // <--- AJOUT IMPORTANT : Espace pour scroller au-dessus des boutons
  },
  
  logoContainer: { marginBottom: 10 },
  logo: { width: 80, height: 80 },

  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#e0e0e0', marginBottom: 20 },

  sectionLabel: { alignSelf: 'flex-start', color: '#fff', marginBottom: 10, fontWeight: 'bold' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  
  roleButton: {
    width: '48%', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  roleButtonActive: {
    backgroundColor: '#fff', 
    borderColor: '#fff',
    elevation: 5
  },
  roleText: { color: '#fff', marginTop: 5, fontWeight: '600', fontSize: 12 },
  roleTextActive: { color: '#185a9d', marginTop: 5, fontWeight: 'bold', fontSize: 12 },

  inputContainer: { width: '100%', marginBottom: 10 },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 15,
  },
  input: { padding: 15, color: '#333', fontSize: 16 },

  button: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 4,
  },
  buttonText: { color: '#185a9d', fontSize: 18, fontWeight: 'bold' },

  linkText: { color: '#f0f0f0', fontSize: 15 },
  linkBold: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' },
});