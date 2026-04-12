import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable'; // Optionnel : pour une petite entrée en fondu du logo

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const animation = useRef(null);

  useEffect(() => {
    // Timer de 3 secondes avant de passer à la suite
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      // Dégradé : Vert Menthe (Santé) -> vers -> Bleu Océan (Confiance)
      colors={['#43cea2', '#185a9d']} 
      start={{ x: 0, y: 0 }} // Coin haut gauche
      end={{ x: 1, y: 1 }}   // Coin bas droite
      style={styles.container}
    >
      
      {/* 1. LE LOGO (Ajouté ici) */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../animations/Logo svg.png')} // Assure-toi que le chemin est bon
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* 2. L'ANIMATION LOTTIE */}
      <View style={styles.lottieContainer}>
        <LottieView
          autoPlay
          ref={animation}
          style={{
            width: width * 0.8, // 80% de la largeur de l'écran
            height: width * 0.8,
            // Important : pas de background color ici pour laisser voir le dégradé
          }}
          source={require('../animations/Fitness.json')}
          loop={false} 
        />
      </View>

      {/* 3. LE TITRE DE L'APP */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Health & Support</Text>
        <Text style={styles.subtitle}>Votre santé, notre priorité</Text>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between', // Répartit l'espace entre haut, milieu et bas
    paddingVertical: 60, // Espace en haut et en bas
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    // Ombre portée pour faire ressortir le logo
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logo: {
    width: 120,  // Ajuste la taille selon ton logo
    height: 120,
  },
  lottieContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff', // Blanc pour contraster avec le dégradé
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Légère ombre pour lisibilité
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#f0f0f0', // Blanc cassé
    marginTop: 5,
    fontWeight: '300',
  }
});