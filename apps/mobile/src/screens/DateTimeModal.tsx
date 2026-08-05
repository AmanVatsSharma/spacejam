import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND = '#FE7A47';
const TEAL = '#48C9B0';
const DARK = '#1A1D1F';
const MUTED = '#9CA3AF';
const BG_GRAY = '#F9FAFB';

const DATES = [
  { day: 'M', num: '5' },
  { day: 'T', num: '6' },
  { day: 'W', num: '7' },
  { day: 'T', num: '8' },
  { day: 'F', num: '9' },
  { day: 'S', num: '10' },
  { day: 'S', num: '11' },
];

const TIMES = [
  '9:00 am', '10:00 am', '11:00 am',
  '12:30 pm', '2:00 pm', '3:30 pm',
  '5:00 pm', '6:00 pm', '7:00 pm'
];

const DURATIONS = ['30m', '1h', '1.5h', '2h'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DateTimeModal() {
  const navigation = useNavigation<any>();

  const [selectedDate, setSelectedDate] = useState('5');
  const [selectedTime, setSelectedTime] = useState('12:30 pm');
  const [selectedDuration, setSelectedDuration] = useState('30m');

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date & Time</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="3" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Date Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {DATES.map((d, i) => {
                const isActive = selectedDate === d.num;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dateBox, isActive && styles.dateBoxActive]}
                    onPress={() => setSelectedDate(d.num)}
                  >
                    <Text style={[styles.dateDay, isActive && styles.txtActive]}>{d.day}</Text>
                    <Text style={[styles.dateNum, isActive && styles.txtActive]}>{d.num}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((time, i) => {
                const isActive = selectedTime === time;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.timeBox, isActive && styles.timeBoxActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeTxt, isActive && styles.txtActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((dur, i) => {
                const isActive = selectedDuration === dur;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.durBox, isActive && styles.durBoxActive]}
                    onPress={() => setSelectedDuration(dur)}
                  >
                    <Text style={[styles.durTxt, isActive && styles.txtActive]}>{dur}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Action */}
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmBtnTxt}>Confirm Selection</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // extra padding for bottom safe area
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },

  // Date
  dateScroll: {
    gap: 12,
  },
  dateBox: {
    width: 50,
    height: 64,
    borderRadius: 12,
    backgroundColor: BG_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBoxActive: {
    backgroundColor: BRAND,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },

  // Time
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeBox: {
    width: '30%',
    height: 44,
    borderRadius: 12,
    backgroundColor: BG_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBoxActive: {
    backgroundColor: BRAND,
  },
  timeTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },

  // Duration
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: BG_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durBoxActive: {
    backgroundColor: TEAL,
  },
  durTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },

  // Shared Active Text
  txtActive: {
    color: '#fff',
  },

  // Confirm Button
  confirmBtn: {
    backgroundColor: '#292B2E',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
