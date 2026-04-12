import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, StatusBar, Platform, TextInput, Animated, SafeAreaView,
  Keyboard, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { sportAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function SportListScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPrograms(programs);
    } else {
      const filtered = programs.filter(program =>
        program.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPrograms(filtered);
    }
  }, [searchQuery, programs]);

  const fetchPrograms = async () => {
    try {
      const data = await sportAPI.getAllPrograms();
      setPrograms(data);
      setFilteredPrograms(data);
      // Animation d'apparition
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  // Header avec recherche et animation
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <LottieView
        source={require('../animations/Sweet run cycle.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      <Text style={styles.headerTitle}>Programmes sportifs</Text>
      <Text style={styles.headerSubtitle}>Trouvez le programme qui vous correspond</Text>

      {/* Barre de recherche moderne */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#43cea2" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un programme..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#185a9d" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getDifficultyConfig = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'difficile':
        return { icon: '🔥', color: '#FF5252', bg: '#FFE2E2', label: 'Avancé' };
      case 'moyen':
        return { icon: '⚡', color: '#FF9800', bg: '#FFF3E0', label: 'Intermédiaire' };
      default:
        return { icon: '🌱', color: '#4CAF50', bg: '#E8F5E9', label: 'Débutant' };
    }
  };

  const renderItem = ({ item, index }) => {
    const difficultyConfig = getDifficultyConfig(item.difficulty);
    const animationDelay = index * 50;

    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })
      }]
    };

    return (
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <View style={styles.card}>
          {/* En-tête auteur cliquable */}
          <TouchableOpacity
            style={styles.authorHeader}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.author?.id })}
            activeOpacity={0.7}
          >
            {item.author?.avatar_url ? (
              <Image source={{ uri: item.author.avatar_url }} style={styles.authorAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {item.author?.full_name?.charAt(0).toUpperCase() || 'C'}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.author?.full_name || 'Coach Sportif'}</Text>
              <Text style={styles.authorRole}>
                {item.author?.role === 'doctor' ? 'Médecin du Sport' : 'Coach Certifié'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#185a9d" style={styles.chevron} />
          </TouchableOpacity>

          {/* Corps du programme */}
          <TouchableOpacity
            style={styles.cardContent}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
          >
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: difficultyConfig.bg }]}>
                <Text style={[styles.badgeText, { color: difficultyConfig.color }]}>
                  {difficultyConfig.icon} {difficultyConfig.label}
                </Text>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {item.description || "Aucune description fournie."}
            </Text>

            <View style={styles.footer}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#185a9d" />
                  <Text style={styles.metaText}>{item.duration || 45} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={16} color="#185a9d" />
                  <Text style={styles.metaText}>{item.exercises_count || 8} exos</Text>
                </View>
              </View>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>Découvrir</Text>
                <Ionicons name="arrow-forward" size={16} color="#185a9d" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Skeleton loader moderne
  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonAuthor}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonAuthorText}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
            </View>
          </View>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonFooter} />
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#43cea2', '#185a9d']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SkeletonLoader />
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
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filteredPrograms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScrollBeginDrag={Keyboard.dismiss}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={60} color="rgba(255,255,255,0.6)" />
                <Text style={styles.emptyTitle}>Aucun programme trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? "Essayez un autre mot-clé" : "Revenez plus tard, de nouveaux programmes arrivent !"}
                </Text>
                {searchQuery && (
                  <TouchableOpacity style={styles.resetButton} onPress={clearSearch}>
                    <Text style={styles.resetButtonText}>Effacer la recherche</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 30,
  },

  // HEADER
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: 16,
  },

  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clearButton: {
    padding: 6,
  },

  // CARTES
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8f9fc',
    borderBottomWidth: 1,
    borderBottomColor: '#eff3f8',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#43cea2',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#43cea2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '700',
    color: '#1e2a3a',
    fontSize: 15,
  },
  authorRole: {
    color: '#6c86a3',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 'auto',
    opacity: 0.6,
  },
  cardContent: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a2540',
    flex: 1,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#5a6e85',
    lineHeight: 20,
    marginBottom: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 13,
    color: '#185a9d',
    fontWeight: '600',
    marginLeft: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef3fc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 6,
  },
  ctaText: {
    color: '#185a9d',
    fontWeight: '700',
    fontSize: 13,
  },

  // SKELETON
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(4px)',
  },
  skeletonAuthor: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 14,
  },
  skeletonAuthorText: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 7,
    width: '80%',
  },
  skeletonContent: {
    padding: 18,
  },
  skeletonTitle: {
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    width: '70%',
    marginBottom: 12,
  },
  skeletonDescription: {
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginBottom: 18,
  },
  skeletonFooter: {
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: '40%',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});