import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image 
} from 'react-native';
import { articleAPI } from '../services/api';

export default function ContentDetailScreen({ route }) {
  const { articleId, themeColor } = route.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await articleAPI.getArticleDetails(articleId);
        setArticle(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [articleId]);

  if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

  return (
    <ScrollView style={styles.container}>
      {/* Grande Image */}
      {article?.image_url && (
        <Image source={{ uri: article.image_url }} style={styles.image} />
      )}

      <View style={styles.contentContainer}>
        <View style={[styles.badge, { backgroundColor: themeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: themeColor }]}>
            {article?.category?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{article?.title}</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.author}>Par Dr. {article?.author?.email || 'Expert'}</Text>
          <Text style={styles.date}>
            {new Date(article?.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.bodyText}>
          {article?.content}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 250 },
  contentContainer: { padding: 20, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, marginBottom: 10 },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  author: { color: '#666', fontStyle: 'italic' },
  date: { color: '#999' },
  
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
  
  bodyText: { fontSize: 16, lineHeight: 24, color: '#444' }
});