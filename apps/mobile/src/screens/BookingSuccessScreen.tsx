/**
 * File:        apps/mobile/src/screens/BookingSuccessScreen.tsx
 * Module:      Mobile · Screens · BookingSuccess
 * Purpose:     Confirmation screen after a successful room/seat booking
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';

export default function BookingSuccessScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        </View>

        <Text style={styles.title}>Booking Confirmed</Text>
        <Text style={styles.subtitle}>Your space has been reserved.</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('MyBookings')}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: DARK,
    fontSize: 16,
    fontWeight: '600',
  },
});
