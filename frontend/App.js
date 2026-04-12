import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './AppNavigator';
import SplashScreen from './screens/SplashScreen';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // 1. Tant que le Splash Screen n'a pas fini son animation, on l'affiche
  if (!appIsReady) {
    return <SplashScreen onFinish={() => setAppIsReady(true)} />;
  }

  // 2. Une fois l'animation finie, on lance la vraie application
  // On englobe tout dans AuthProvider pour que le Token soit accessible partout
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}