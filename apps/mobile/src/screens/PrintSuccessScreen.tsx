import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function PrintSuccessScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="8 12 11 15 16 9" strokeWidth="1.5" />
        </Svg>
      </View>
      
      <Text style={styles.title}>Print Ready</Text>
      <Text style={styles.subtitle}>Print request processed successfully!</Text>

      <TouchableOpacity style={styles.returnBtn} onPress={() => onNavigate('Home')}>
        <Text style={styles.returnBtnTxt}>Return Home</Text>
      </TouchableOpacity>
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
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    marginBottom: 40,
  },
  returnBtn: {
    paddingHorizontal: 32,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  returnBtnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
  }
});
