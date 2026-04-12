import React, { useEffect, useState, useRef, useContext, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, Image, Dimensions, StatusBar, Platform,
  AccessibilityInfo
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

import { sportAPI, activityAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// --- Composant Exercice individuel (memoized) ---
const ExerciseCard = memo(({ exercise, isDone, onPress, isVideoActive, onVideoActivate }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Si une autre vidéo devient active et que ce n'est pas la nôtre, on pause
    if (isVideoActive && isVideoActive !== exercise.id) {
      videoRef.current?.pauseAsync();
    }
  }, [isVideoActive, exercise.id]);

  const handlePress = () => {
    if (!isDone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(exercise.id);
    }
  };

  const handleVideoLoadStart = () => {
    onVideoActivate(exercise.id);
  };

  return (
    <Animatable.View animation="fadeInUp" delay={exercise.index * 80} duration={400}>
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        activeOpacity={0.85}
        onPress={handlePress}
        accessibilityLabel={`Exercice ${exercise.title}, ${isDone ? 'terminé' : 'non terminé'}`}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
            {isDone && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.exoTitle, isDone && styles.exoTitleDone]}>{exercise.title}</Text>
            <View style={styles.exoMetaRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.exoMeta}> {exercise.duration_minutes} min</Text>
              <Ionicons name="flame-outline" size={14} color="#FF6B35" style={{ marginLeft: 12 }} />
              <Text style={styles.exoMeta}> {exercise.calories || 45} kcal</Text>
            </View>
          </View>
        </View>

        {exercise.media_url && !isDone && (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: exercise.media_url }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              shouldPlay={false}
              onLoadStart={handleVideoLoadStart}
              onError={() => console.log('Video error')}
            />
          </View>
        )}

        <Text style={styles.instructions} numberOfLines={2}>
          {exercise.instructions}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
});

export default function ProgramDetailScreen({ route, navigation }) {
  const { programId } = route.params;
  const { user } = useContext(AuthContext);
  const isCoach = user?.role === 'coach';

  const videoController = useRef(null); // Pour gérer la vidéo active
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null);

  // Chargement des données
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const programData = await sportAPI.getProgramDetails(programId);
          setProgram(programData);
        } catch (error) {
          Alert.alert('Erreur', 'Impossible de charger le programme. Vérifiez votre connexion.');
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [programId])
  );

  // Démarrage de la séance
  useEffect(() => {
    const startSession = async () => {
      if (!activityId && !loading && program) {
        try {
          const sessionData = await activityAPI.startActivity(programId);
          setActivityId(sessionData.activityId);
        } catch (e) {
          // Ignorer si déjà actif
          console.log('Session already active');
        }
      }
    };
    startSession();
  }, [loading, programId, program]);

  const handleMarkExercise = async (exerciseId) => {
    if (!activityId || completedExercises.includes(exerciseId)) return;
    // Optimistic update
    setCompletedExercises(prev => [...prev, exerciseId]);
    try {
      const response = await activityAPI.markExerciseDone(activityId, exerciseId);
      setTotalCalories(response.totalCalories);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Rollback
      setCompletedExercises(prev => prev.filter(id => id !== exerciseId));
      Alert.alert('Erreur', 'Impossible de valider l\'exercice. Réessayez.');
    }
  };

  const handleCompleteSession = async () => {
    const totalExos = program?.exercises?.length || 0;
    const doneExos = completedExercises.length;

    if (doneExos < totalExos) {
      Alert.alert(
        "Séance incomplète",
        `Vous avez réalisé ${doneExos}/${totalExos} exercices. Voulez-vous vraiment terminer ?`,
        [
          { text: "Continuer", style: "cancel" },
          { text: "Terminer quand même", onPress: submitFinish, style: "destructive" }
        ]
      );
    } else {
      submitFinish();
    }
  };

  const submitFinish = async () => {
    setSaving(true);
    try {
      await activityAPI.finishActivity({
        activityId,
        feedback: 'Super séance ! 💪',
        duration_minutes: program?.duration || 45,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
      Alert.alert('Félicitations ! 🎉', `Vous avez brûlé ${totalCalories} kcal !`);
    } catch (error) {
      Alert.alert('Erreur', 'Problème lors de la finalisation. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoActivate = (exerciseId) => {
    setActiveVideoId(exerciseId);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#43cea2', '#185a9d']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Chargement du programme...</Text>
      </LinearGradient>
    );
  }

  const progress = program?.exercises?.length
    ? completedExercises.length / program.exercises.length
    : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <LinearGradient
      colors={['#43cea2', '#185a9d']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Barre de progression flottante */}
      <Animatable.View animation="fadeInDown" duration={500} style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression</Text>
          <View style={styles.caloriesBadge}>
            <Ionicons name="flame" size={16} color="#FFD700" />
            <Text style={styles.caloriesText}>{totalCalories} kcal</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressStats}>
          {completedExercises.length} / {program?.exercises?.length} exercices • {progressPercent}%
        </Text>
      </Animatable.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec animation */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.header}>
          <LottieView
            source={require('../animations/Sweet run cycle.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.title}>{program?.title}</Text>
          <Text style={styles.description}>{program?.description}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Ionicons name="barbell-outline" size={16} color="#fff" />
              <Text style={styles.infoChipText}>{program?.exercises?.length} exos</Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.infoChipText}>{program?.duration || 45} min</Text>
            </View>
          </View>
        </Animatable.View>

        <Text style={styles.sectionTitle}>📋 Exercices</Text>

        {program?.exercises?.map((exo, idx) => (
          <ExerciseCard
            key={exo.id}
            exercise={{ ...exo, index: idx }}
            isDone={completedExercises.includes(exo.id)}
            onPress={handleMarkExercise}
            isVideoActive={activeVideoId}
            onVideoActivate={handleVideoActivate}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton flottant de validation */}
      <Animatable.View animation="fadeInUp" delay={300} style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            (completedExercises.length === 0 || saving) && styles.finishButtonDisabled
          ]}
          onPress={handleCompleteSession}
          disabled={saving || completedExercises.length === 0}
          activeOpacity={0.8}
          accessibilityLabel="Terminer la séance"
        >
          {saving ? (
            <ActivityIndicator color="#185a9d" />
          ) : (
            <>
              <Text style={styles.finishText}>
                {completedExercises.length === program?.exercises?.length
                  ? "🏆 TERMINER LA SÉANCE"
                  : "✅ VALIDER ET QUITTER"}
              </Text>
              {completedExercises.length > 0 && (
                <Ionicons name="arrow-forward" size={20} color="#185a9d" style={styles.finishIcon} />
              )}
            </>
          )}
        </TouchableOpacity>
      </Animatable.View>

      {/* FAB pour coach */}
      {isCoach && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExercise', { programId })}
          activeOpacity={0.8}
          accessibilityLabel="Ajouter un exercice"
        >
          <Ionicons name="add" size={32} color="#185a9d" />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '500' },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 100 : 120,
    paddingBottom: 20,
  },

  // Barre progression
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#fff', fontWeight: '600', fontSize: 13, letterSpacing: 0.5 },
  caloriesBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  caloriesText: { color: '#FFD700', fontWeight: 'bold', marginLeft: 4, fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  progressStats: { color: '#eee', fontSize: 11, marginTop: 6, textAlign: 'center' },

  // Header
  header: { alignItems: 'center', marginBottom: 28 },
  lottie: { width: 110, height: 110 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 6,
    fontSize: 15,
    paddingHorizontal: 20,
  },
  infoRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, gap: 6 },
  infoChipText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16, marginLeft: 4, letterSpacing: -0.3 },

  // Cartes exercices
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardDone: { opacity: 0.65, backgroundColor: '#f5f5f5' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#43cea2',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#43cea2', borderColor: '#43cea2' },
  cardInfo: { flex: 1 },
  exoTitle: { fontSize: 18, fontWeight: '700', color: '#1e2a3a', marginBottom: 4 },
  exoTitleDone: { textDecorationLine: 'line-through', color: '#9aa6b5' },
  exoMetaRow: { flexDirection: 'row', alignItems: 'center' },
  exoMeta: { color: '#6c86a3', fontSize: 13, fontWeight: '500' },
  videoWrapper: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  instructions: { color: '#4a5b6e', fontSize: 14, lineHeight: 20, marginTop: 4 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  finishButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  finishButtonDisabled: { opacity: 0.5 },
  finishText: { color: '#185a9d', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  finishIcon: { marginLeft: 4 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#fff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});