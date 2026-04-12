import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native'; // ✅ Import de Lottie
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AuthContext } from '../context/AuthContext';
import { userAPI } from '../services/api';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    specialty: '',
    contact_email: '',
    weight_kg: '',
    height_cm: '',
    avatar_url: null,
    role: 'patient'
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile({
        full_name: data.full_name || '',
        bio: data.bio || '',
        specialty: data.specialty || '',
        contact_email: data.contact_email || '',
        weight_kg: data.weight_kg ? data.weight_kg.toString() : '',
        height_cm: data.height_cm ? data.height_cm.toString() : '',
        avatar_url: data.avatar_url || null,
        role: data.role || 'patient'
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (image) => {
    try {
      setUploading(true);
      const formData = new FormData();
      const uri = image.uri;
      const fileType = uri.split('.').pop();
      const fileName = uri.split('/').pop();

      formData.append('avatar', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const response = await userAPI.uploadAvatar(formData);

      setProfile(prev => ({
        ...prev,
        avatar_url: response.avatar_url
      }));

      Alert.alert("Succès", "Photo de profil mise à jour !");
    } catch (err) {
      console.error("Détail erreur upload:", err);
      Alert.alert("Erreur", "Vérifiez votre connexion au serveur.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        ...profile,
        weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
        height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
      });
      Alert.alert("Succès", "Profil mis à jour avec succès !");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  // Sélecteur de rôle pour les professionnels
  const renderRoleSelector = () => {
    if (profile.role === 'patient') {
      return (
        <View style={styles.readOnlyRole}>
          <Ionicons name="person-circle-outline" size={24} color="#185a9d" />
          <Text style={styles.readOnlyRoleText}>Compte Patient (Membre)</Text>
        </View>
      );
    }

    const roles = [
      { key: 'coach', label: 'Coach', icon: 'barbell-outline' },
      { key: 'nutritionist', label: 'Nutritionniste', icon: 'nutrition-outline' },
      { key: 'doctor', label: 'Médecin', icon: 'medkit-outline' },
    ];

    return (
      <View style={styles.roleContainer}>
        <Text style={styles.label}>Votre profession</Text>
        <View style={styles.roleRow}>
          {roles.map((r) => {
            const isSelected = profile.role === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleButton, isSelected && styles.roleButtonActive]}
                onPress={() => setProfile({ ...profile, role: r.key })}
              >
                <Ionicons
                  name={r.icon}
                  size={20}
                  color={isSelected ? '#fff' : '#666'}
                />
                <Text style={[styles.roleText, isSelected && styles.roleTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#43cea2', '#185a9d']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec animation Lottie + avatar */}
        <View style={styles.headerContainer}>
          {/* Animation Lottie */}
          <View style={styles.lottieWrapper}>
            <LottieView
              source={require('../animations/Profile user card.json')} // Remplace par ton fichier d'animation
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          {/* Avatar avec badge caméra */}
          <TouchableOpacity onPress={pickAvatar} disabled={uploading} style={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}

            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}

            <View style={styles.editBadge}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mon profil</Text>
          <Text style={styles.headerSubtitle}>Touchez l'avatar pour le modifier</Text>
        </View>

        {/* Carte formulaire */}
        <View style={styles.formCard}>
          {/* Sélecteur de rôle */}
          {renderRoleSelector()}

          {/* Nom complet */}
          <Text style={styles.label}>Nom complet</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#185a9d" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={profile.full_name}
              onChangeText={(txt) => setProfile({ ...profile, full_name: txt })}
              placeholder="Votre nom"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Spécialité pour pros */}
          {profile.role !== 'patient' && (
            <>
              <Text style={styles.label}>Spécialité</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="ribbon-outline" size={20} color="#185a9d" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={profile.specialty}
                  onChangeText={(txt) => setProfile({ ...profile, specialty: txt })}
                  placeholder="Ex: Kiné, Yoga, Nutrition..."
                  placeholderTextColor="#aaa"
                />
              </View>
            </>
          )}

          {/* Bio */}
          <Text style={styles.label}>Bio / Description</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={profile.bio}
              onChangeText={(txt) => setProfile({ ...profile, bio: txt })}
              placeholder="Parlez-nous de vous..."
              placeholderTextColor="#aaa"
              textAlignVertical="top"
            />
          </View>

          {/* Email de contact */}
          <Text style={styles.label}>Email de contact (public)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#185a9d" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={profile.contact_email}
              onChangeText={(txt) => setProfile({ ...profile, contact_email: txt })}
              placeholder="email@exemple.com"
              keyboardType="email-address"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Ligne Poids / Taille (pour tous) */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Poids (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="fitness-outline" size={20} color="#185a9d" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={profile.weight_kg}
                  onChangeText={(txt) => setProfile({ ...profile, weight_kg: txt })}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Taille (cm)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="resize-outline" size={20} color="#185a9d" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={profile.height_cm}
                  onChangeText={(txt) => setProfile({ ...profile, height_cm: txt })}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          </View>

          {/* Bouton de sauvegarde */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#43cea2', '#185a9d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton de déconnexion */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 30,
  },

  // --- HEADER AVEC ANIMATION ---
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  lottieWrapper: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  lottie: {
    width: 120,
    height: 120,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#185a9d',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
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
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  halfInput: {
    width: '48%',
  },

  // --- SÉLECTEUR DE RÔLE ---
  readOnlyRole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d0e0ff',
  },
  readOnlyRoleText: {
    marginLeft: 10,
    color: '#185a9d',
    fontWeight: 'bold',
    fontSize: 15,
  },
  roleContainer: {
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  roleButton: {
    width: '31%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleButtonActive: {
    backgroundColor: '#185a9d',
    borderColor: '#185a9d',
  },
  roleText: {
    fontSize: 11,
    marginTop: 5,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  roleTextActive: {
    color: '#fff',
  },

  // --- BOUTONS ---
  saveButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 30,
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
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingVertical: 15,
    borderRadius: 30,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});