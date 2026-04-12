import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, StatusBar 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { articleAPI } from '../services/api';

export default function ContentListScreen({ route, navigation }) {
  const { category } = route.params; 
  const animation = useRef(null);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- CONFIGURATION DU THÈME ---
  const isNutrition = category === 'nutrition';
  
  // Textes
  const screenTitle = isNutrition ? "Nutrition & Recettes" : "Conseils Médicaux";
  const subtitle = isNutrition ? "Mangez sain, vivez mieux." : "Prenez soin de votre santé.";
  
  // Couleurs
  const themeColor = isNutrition ? '#4CAF50' : '#EF5350'; 
  const lightColor = isNutrition ? '#E8F5E9' : '#FFEBEE'; 
  
  // Animations
  const lottieSource = isNutrition 
    ? require('../animations/Nutrition.json') 
    : require('../animations/Doctor, Medical, Surgeon, Healthcare Animation.json'); 

  useEffect(() => {
    navigation.setOptions({ 
      headerShown: true,
      title: '', 
      headerStyle: { backgroundColor: lightColor }, 
      headerShadowVisible: false, 
      headerTintColor: themeColor,
    });

    const fetchArticles = async () => {
      try {
        const data = await articleAPI.getArticles(category);
        setArticles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [category]);

  // --- HEADER (Lottie) ---
  const ListHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: lightColor }]}>
      <View style={styles.lottieContainer}>
        <LottieView
          autoPlay
          ref={animation}
          style={{ width: 120, height: 120 }}
          source={lottieSource}
        />
      </View>
      <Text style={[styles.headerTitle, { color: themeColor }]}>{screenTitle}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );

  // --- RENDU DE LA CARTE ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9} 
      onPress={() => navigation.navigate('ContentDetail', { articleId: item.id, themeColor })}
    >
      {/* --- NOUVEAU : EN-TÊTE AUTEUR (Facebook Style) --- */}
      <View style={styles.authorHeader}>
        <TouchableOpacity 
          style={{flexDirection: 'row', alignItems: 'center'}}
          // Navigation vers le profil public quand on clique sur le nom/avatar
          onPress={() => navigation.navigate('PublicProfile', { userId: item.author?.id })}
        >
          <Image 
            source={{ uri: item.author?.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.authorAvatar} 
          />
          <View>
            <Text style={styles.authorName}>{item.author?.full_name || 'Auteur Inconnu'}</Text>
            {/* On simule une date relative */}
            <Text style={styles.postDate}>Il y a 2h</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* ------------------------------------------------ */}

      {/* Image de l'article */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: themeColor + '40' }]}>
             <Text style={{fontSize: 30}}>📝</Text>
          </View>
        )}
        
        {/* Badge Catégorie */}
        <View style={[styles.badge, { backgroundColor: themeColor }]}>
          <Text style={styles.badgeText}>{isNutrition ? 'Recette' : 'Conseil'}</Text>
        </View>
      </View>
      
      {/* Contenu Texte */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPreview} numberOfLines={2}>
          {item.content}
        </Text>
        
        {/* Footer avec bouton Lire */}
        <View style={styles.footerRow}>
          <Text style={[styles.readMoreText, { color: themeColor }]}>Lire l'article</Text>
          <View style={[styles.arrowBtn, { backgroundColor: themeColor + '20' }]}>
            <Text style={{ color: themeColor, fontWeight: 'bold' }}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: lightColor }]}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F5F7FA' }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={lightColor} />
      
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun contenu pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },

  // HEADER PAGE
  headerContainer: {
    alignItems: 'center', paddingVertical: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
  },
  lottieContainer: {
    backgroundColor: '#fff', borderRadius: 60, padding: 5, marginBottom: 10, elevation: 2
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 5, fontStyle: 'italic' },

  // CARTE ARTICLE
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    overflow: 'hidden'
  },

  // --- NOUVEAUX STYLES AUTEUR ---
  authorHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff'
  },
  authorAvatar: {
    width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee'
  },
  authorName: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  postDate: { color: '#999', fontSize: 12 },
  // ------------------------------

  imageContainer: { height: 160, width: '100%', position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  badge: {
    position: 'absolute', top: 15, right: 15,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  cardContent: { padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  cardPreview: { fontSize: 14, color: '#757575', lineHeight: 20, marginBottom: 15 },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readMoreText: { fontWeight: 'bold', fontSize: 15 },
  arrowBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16 }
});