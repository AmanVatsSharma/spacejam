import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#9CA3AF';
const BG = '#F7F9FC';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PREF_TIMES = [
  { id: 'Morning', label: 'Morning', time: '9 AM – 1 PM' },
  { id: 'Afternoon', label: 'Afternoon', time: '1 PM – 6 PM' },
  { id: 'Full Day', label: 'Full Day', time: '9 AM – 8 PM' },
  { id: 'Custom', label: 'Custom', time: "I'll specify" },
];

const DURATIONS = ['1 day', '1 week', '2 weeks', '1 month', '3 months', '6 months'];

export default function CustomOfferModal() {
  const navigation = useNavigation<any>();

  const [teamSize, setTeamSize] = useState(2);
  const [prefTime, setPrefTime] = useState('Full Day');
  const [duration, setDuration] = useState('1 month');

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Request Custom Offer</Text>
              <Text style={styles.subtitle}>Tell us your needs · Manager sends discount</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerIconBox}>
                <Text style={styles.bannerIconTxt}>30%</Text>
              </View>
              <View style={styles.bannerTxtCol}>
                <Text style={styles.bannerTitle}>Claiming 30% Custom Offer</Text>
                <Text style={styles.bannerSub}>Manager will review & personalize your discount</Text>
              </View>
            </View>

            {/* Section: Number of People */}
            <Text style={styles.sectionTitle}>NUMBER OF PEOPLE</Text>
            <View style={styles.peopleBox}>
              <View>
                <Text style={styles.peopleTitle}>Team size</Text>
                <Text style={styles.peopleSub}>{teamSize} people</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity 
                  style={[styles.stepBtn, { backgroundColor: '#fff' }]} 
                  onPress={() => setTeamSize(Math.max(1, teamSize - 1))}
                >
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="3">
                    <Path d="M5 12h14" />
                  </Svg>
                </TouchableOpacity>
                
                <Text style={styles.stepVal}>{teamSize}</Text>
                
                <TouchableOpacity 
                  style={[styles.stepBtn, { backgroundColor: BRAND }]} 
                  onPress={() => setTeamSize(teamSize + 1)}
                >
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <Path d="M12 5v14M5 12h14" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section: Preferred Time */}
            <Text style={styles.sectionTitle}>PREFERRED TIME</Text>
            <View style={styles.grid}>
              {PREF_TIMES.map((item) => {
                const isActive = prefTime === item.id;
                return (
                  <TouchableOpacity 
                    key={item.id}
                    style={[styles.gridItem, isActive && styles.gridItemActive]}
                    onPress={() => setPrefTime(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.gridIcon, isActive && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#fff' : BRAND} strokeWidth="2.5">
                        <Circle cx="12" cy="12" r="10" />
                        <Polyline points="12 6 12 12 16 14" />
                      </Svg>
                    </View>
                    <Text style={[styles.gridTitle, isActive && { color: '#fff' }]}>{item.label}</Text>
                    <Text style={[styles.gridSub, isActive && { color: 'rgba(255,255,255,0.8)' }]}>{item.time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section: Duration Needed */}
            <Text style={styles.sectionTitle}>DURATION NEEDED</Text>
            <View style={styles.pillGrid}>
              {DURATIONS.map((dur) => {
                const isActive = duration === dur;
                return (
                  <TouchableOpacity 
                    key={dur}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => setDuration(dur)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillTxt, isActive && styles.pillTxtActive]}>{dur}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section: Earliest Start Date */}
            <Text style={[styles.sectionTitle, { marginBottom: 40 }]}>EARLIEST START DATE</Text>
            {/* The image cuts off right below the text, we'll leave space for the sticky button */}

          </ScrollView>

          {/* Sticky Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <Line x1="22" y1="2" x2="11" y2="13" />
                <Polygon points="22 2 15 22 11 13 2 9 22 2" />
              </Svg>
              <Text style={styles.submitBtnTxt}>Send to Manager</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
}

// Custom Polygon since it wasn't imported from svg above
import { Polygon } from 'react-native-svg';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '92%',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // Banner
  banner: {
    backgroundColor: '#FFF0E6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  bannerIconBox: {
    backgroundColor: BRAND,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bannerIconTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  bannerTxtCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 12,
    color: '#8c8c8c',
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: MUTED,
    marginBottom: 16,
  },

  // Number of People
  peopleBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  peopleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  peopleSub: {
    fontSize: 13,
    color: MUTED,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepVal: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
  },

  // Grid (Preferred Time)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  gridItemActive: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gridIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  gridSub: {
    fontSize: 11,
    color: MUTED,
  },

  // Pills (Duration)
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  pill: {
    width: '31%',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pillTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTxtActive: {
    color: '#fff',
  },

  // Footer Button
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
