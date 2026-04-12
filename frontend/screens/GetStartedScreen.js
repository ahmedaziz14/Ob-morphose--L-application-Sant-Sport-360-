import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Import du dégradé
import * as Animatable from 'react-native-animatable'; // Animation d'entrée pour le texte

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen({ navigation }) {
  return (
    <View style={styles.container}>
      
      
      <LinearGradient
        colors={['#43cea2', '#185a9d']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.illustrationContainer}
      >
        {/* Logo en haut */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../animations/Logo svg.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        
        <View style={styles.lottieWrapper}>
            <LottieView
              autoPlay
              style={{ width: width * 0.8, height: width * 0.8 }}
              source={require('../animations/Fitness.json')} 
            />
        </View>
      </LinearGradient>

      
      <Animatable.View 
        animation="fadeInUp" 
        duration={1000}
        style={styles.textContainer}
      >
        <Text style={styles.title}>Prenez soin de votre santé</Text>
        <Text style={styles.subtitle}>
          Suivez vos programmes sportifs, vos régimes et discutez avec des professionnels de santé en un clic.
        </Text>

        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <LinearGradient
                colors={['#185a9d', '#43cea2']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
            >
                <Text style={styles.buttonText}>Commencer</Text>
                
            </LinearGradient>
        </TouchableOpacity>

      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // --- PARTIE HAUTE ---
  illustrationContainer: { 
    flex: 2, // Prend 2/3 de l'écran environ
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logo: {
    width: 90,
    height: 90,
  },
  lottieWrapper: {
    marginTop: 40, // Pour descendre l'anim sous le logo
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- PARTIE BASSE ---
  textContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
    marginTop: -30, // Chevauchement sur le dégradé
    
    // Ombre pour détacher la carte blanche du fond
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#185a9d', // Bleu foncé du thème
    textAlign: 'center', 
    marginBottom: 15 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#7f8c8d', 
    textAlign: 'center', 
    marginBottom: 40, 
    lineHeight: 24 
  },
  
  // --- BOUTON ---
  button: {
    width: width * 0.8, // 80% de la largeur
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 5,
    shadowColor: "#185a9d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1 
  }
});