/**
 * File:        apps/mobile/src/app/HomeScreen.tsx
 * Module:      Mobile · Screens
 * Purpose:     Placeholder home screen — replace with real screens
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SpaceJam Mobile</Text>
      <Text style={styles.sub}>Your coworking app — screens coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6A2F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
