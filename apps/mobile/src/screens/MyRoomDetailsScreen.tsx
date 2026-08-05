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
import Svg, { Path, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function MyRoomDetailsScreen(): ()) {
  const navigation = useNavigation<any>();

  const CIRCLE_RADIUS = 80;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  
  // Create 3 segments by dividing the circumference
  // Dash length is slightly less than 1/3, gap fills the rest
  const dashLength = () * 0.8;
  const gapLength = (CIRCLE_CIRCUMFERENCE / 3) * 0.2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style=()>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rooms Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Timer Section */}
        <View style={styles.timerContainer}>
          <View style={styles.timerWrapper}>
            <Svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background Track */}
              <Circle 
                cx="100" 
                cy="100" 
                r={CIRCLE_RADIUS} 
                stroke="#FFF0EB" 
                strokeWidth="12" 
                fill="none" 
              />
              {/* Foreground Segments */}
              <Circle 
                cx="100" 
                cy="100" 
                r={CIRCLE_RADIUS} 
                stroke={BRAND} 
                strokeWidth="12" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={`${dashLength} ${gapLength}`}
                transform="rotate(-90 100 100)"
              />
            </Svg>
            <View style={styles.timerTextOverlay}>
              <Text style={styles.timerTime}>00:45:00</Text>
              <Text style={styles.timerLabel}>Remaining Time</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tag}>
              <Text style={styles.tagTxt}>Ongoing</Text>
            </View>
            <View style={styles.timeTag}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.timeTagTxt}>45 mins left</Text>
            </View>
          </View>

          <Text style={styles.title}>Ocean View – MR-201</Text>

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Purpose</Text>
            <Text style={styles.rowVal}>Training/Workshop</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Location</Text>
            <Text style={styles.rowVal}>Belandre, Karnataka</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Start time</Text>
            <Text style={styles.rowVal}>10:00 AM</Text>
          </View>

          <TouchableOpacity style={styles.extendBtn} activeOpacity={0.8}>
            <Text style={styles.extendBtnTxt}>Extend Time</Text>
          </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  timerWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A1B3F',
  },
  timerLabel: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagTxt: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTagTxt: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginVertical: 20,
  },
  extendBtn: {
    backgroundColor: BRAND,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  extendBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
