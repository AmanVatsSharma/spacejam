import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function TermsScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using SpaceJam services, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>

          <Text style={styles.sectionTitle}>2. Use of Service</Text>
          <Text style={styles.paragraph}>
            You agree to use our booking services only for lawful purposes and in accordance with these Terms. You are responsible for all activities that occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>3. Booking Policy</Text>
          <Text style={styles.paragraph}>
            All bookings are subject to availability. Cancellations must be made at least 24 hours in advance for a full refund. Late cancellations may incur charges.
          </Text>

          <Text style={styles.sectionTitle}>4. Payment Terms</Text>
          <Text style={styles.paragraph}>
            Payment is required at the time of booking. We accept all major credit cards and digital payment methods. All prices are in Indian Rupees (₹).
          </Text>

          <Text style={styles.sectionTitle}>5. Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy to provide and improve our services.
          </Text>
          
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: MUTED,
    lineHeight: 22,
    marginBottom: 24,
  },
});
