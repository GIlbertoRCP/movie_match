import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import ServerColdStartBanner from './components/ServerColdStartBanner';
import HomeScreen from './components/HomeScreen';

export default function App() {
  return (
    <ThemeProvider>
      <ServerColdStartBanner />
      <HomeScreen />
    </ThemeProvider>
  );
}
