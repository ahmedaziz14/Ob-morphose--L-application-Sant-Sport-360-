import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // ✅ Import vital
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes
import { AuthContext } from './context/AuthContext';

// --- IMPORTS DES ÉCRANS ---
import GetStartedScreen from './screens/GetStartedScreen'; 
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Écrans Patient
import HomeScreen from './screens/HomeScreen';
import SportListScreen from './screens/SportListScreen';

// Écrans Pro
import ProHomeScreen from './screens/ProHomeScreen';
import CreateEventScreen from './screens/CreateEventScreen'; // Assure-toi du chemin (ex: ../screens/forms/...)
import CreateProgramScreen from './screens/CreateProgramScreen';
import CreateArticleScreen from './screens/CreateContentScreen';
import AddExerciseScreen from './screens/AddExerciseScreen';

// Écrans Communs
import ProgramDetailScreen from './screens/ProgramDetailScreen';
import ContentListScreen from './screens/ContentListScreen';
import ContentDetailScreen from './screens/ContentDetailScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import EventsScreen from './screens/EventsScreen';
import ProfileScreen from './screens/ProfileScreen';
import InboxScreen from './screens/InboxScreen';
import ActivityHistoryScreen from './screens/ActivityHistoryScreen';
import NutritionScreen from './screens/NutritionScreen' ; 
import NotificationsScreen from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. MENU DU BAS POUR LES PATIENTS (ClientTabs)
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SportList') iconName = focused ? 'fitness' : 'fitness-outline';
          else if (route.name === 'Inbox') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen}  />
      <Tab.Screen name="SportList" component={SportListScreen}  />
      <Tab.Screen name="Inbox" component={InboxScreen}  />
      <Tab.Screen name="Profile" component={ProfileScreen}  />
      <Stack.Screen 
  name="Notifications" 
  component={NotificationsScreen} 
  options={{ headerShown: false }} 
/>
    </Tab.Navigator>
  );
}

// 2. MENU DU BAS POUR LES PROS (ProTabs)
function ProTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#5856D6', // Violet distinctif pour les Pros
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'ProHome') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Inbox') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen}  />
      <Tab.Screen name="Inbox" component={InboxScreen}  />
      <Tab.Screen name="Events" component={EventsScreen}  />
      <Tab.Screen name="Profile" component={ProfileScreen}  />
      <Stack.Screen 
  name="Notifications" 
  component={NotificationsScreen} 
  options={{ headerShown: false }} 
/>
    </Tab.Navigator>
  );
}

// 3. NAVIGATEUR PRINCIPAL
export default function AppNavigator() {
  // ✅ On récupère 'user' en plus du token pour vérifier le rôle
  const { token, isLoading, user } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {token === null ? (
          // --- NON CONNECTÉ (Auth) ---
          <>
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // --- CONNECTÉ (App) ---
          <>
            {/* A. ROUTAGE PRINCIPAL : Choix entre Patient ou Pro */}
            {user?.role === 'patient' ? (
              <Stack.Screen name="ClientTabs" component={ClientTabs} />
            ) : (
              <Stack.Screen name="ProTabs" component={ProTabs} />
            )}

            {/* B. ÉCRANS PARTAGÉS (Accessibles via navigation.navigate depuis les Tabs) */}
            {/* Ces écrans s'empilent PAR DESSUS la barre de menu (Tabs) */}
            
            {/* Détails Sport & Contenu */}
            <Stack.Screen 
              name="ProgramDetail" 
              component={ProgramDetailScreen} 
              
            />
             {/* Pour permettre au patient d'aller voir la liste des sports s'il clique sur "Sport" dans Home */}
            <Stack.Screen 
              name="SportListStack" // Nom différent du Tab pour éviter conflit
              component={SportListScreen} 
              
            />
            <Stack.Screen 
              name="ContentList" 
              component={ContentListScreen} 
             
            />
            <Stack.Screen 
              name="ContentDetail" 
              component={ContentDetailScreen} 
              
            />
            
            {/* Social & Profils */}
            <Stack.Screen 
              name="PublicProfile" 
              component={PublicProfileScreen} 
              
            />
            <Stack.Screen 
              name="ChatRoom" 
              component={ChatRoomScreen} 
              
            />

            {/* Activité & Historique */}
            <Stack.Screen 
              name="Activity" // ✅ Nom corrigé pour correspondre au HomeScreen
              component={ActivityHistoryScreen} 
              
            />
            <Stack.Screen 
              name="Events" 
              component={EventsScreen}
              
            />

            {/* Formulaires de Création (Pour les Pros) */}
            <Stack.Screen name="CreateEvent" component={CreateEventScreen}  />
            <Stack.Screen name="CreateProgram" component={CreateProgramScreen}  />
            <Stack.Screen name="CreateContent" component={CreateArticleScreen} />
<Stack.Screen 
  name="AddExercise" 
  component={AddExerciseScreen} 
  options={{ title: 'Nouvel Exercice', headerShown: true }} 
/>
 <Stack.Screen 
  name="NutritionScanner" 
  component={NutritionScreen} 
  options={{ headerShown: false }} 
/>

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}