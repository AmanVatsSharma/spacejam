import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const YELLOW = '#FCD34D';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BG = '#fff';

export default function PrintProcessingScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('PrintSuccess');
    }, 2500); // simulate 2.5 seconds processing
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <View style={styles.dash} />
        <View style={styles.dash} />
        <View style={styles.dash} />
      </View>
      <Text style={styles.title}>Your Printing is processing !</Text>
      <Text style={styles.subtitle}>Your printing request is being processed.</Text>
      <Text style={styles.subtitle}>Hang tight!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dash: {
    width: 16,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  }
});
