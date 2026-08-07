import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Branding Card */}
        <View style={styles.brandCard}>
          <View style={styles.logoBox}>
            <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <Path d="M9 22v-4h6v4"/>
              <Path d="M9 6h6"/>
              <Path d="M9 10h6"/>
              <Path d="M9 14h6"/>
            </Svg>
          </View>
          <Text style={styles.appName}>SpaceJam</Text>
          <Text style={styles.appDesc}>Meeting Room Booking Platform</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Version</Text>
            <Text style={styles.rowVal}>2.4.1</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLbl}>User ID</Text>
            <Text style={styles.rowVal}>USR-2024-8745</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Debug ID</Text>
            <Text style={styles.rowVal}>DBG-X9K2-LM3P</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTxt}>© 2026 SpaceJam. All rights reserved.</Text>
          <Text style={styles.footerTxt}>Made with care in India</Text>
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
  brandCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: BRAND,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  appDesc: {
    fontSize: 14,
    color: MUTED,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLbl: {
    fontSize: 15,
    color: MUTED,
  },
  rowVal: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    alignItems: 'center',
  },
  footerTxt: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
});
