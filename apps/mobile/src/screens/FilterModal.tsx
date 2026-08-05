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
import Svg, { Path, Rect, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#EAEAEA';
const BG_GRAY = '#F4F5F6';

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM',
];

const SEATS = ['6 seat', '8 seat', '10 seat', '12 seat'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FilterModal() {
  const navigation = useNavigation<any>();

  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('10:00 AM');
  const [seats, setSeats] = useState('8 seat');

  const handleClear = () => {
    setDate('Today');
    setTime('');
    setSeats('');
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* ── Date Section ── */}
            <SectionTitle title="Date" />
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={[styles.datePill, date === 'Today' ? styles.datePillActive : styles.datePillInactive]}
                onPress={() => setDate('Today')}
              >
                <Text style={date === 'Today' ? styles.dateTxtActive : styles.dateTxtInactive}>Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.datePill, date === 'Tomorrow' ? styles.datePillActive : styles.datePillInactive]}
                onPress={() => setDate('Tomorrow')}
              >
                <Text style={date === 'Tomorrow' ? styles.dateTxtActive : styles.dateTxtInactive}>Tomorrow</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.calBtn}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <Line x1="16" y1="2" x2="16" y2="6" />
                  <Line x1="8" y1="2" x2="8" y2="6" />
                  <Line x1="3" y1="10" x2="21" y2="10" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.dividerLight} />

            {/* ── Time slot Section ── */}
            <SectionTitle title="Time slot" />
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((t) => {
                const isActive = time === t;
                return (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.timeBox, isActive && styles.boxActive]}
                    onPress={() => setTime(t)}
                  >
                    <Text style={[styles.timeTxt, isActive && styles.txtActive]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.dividerLight} />

            {/* ── Number of seats Section ── */}
            <SectionTitle title="Number of seats" />
            <View style={styles.seatsRow}>
              {SEATS.map((s) => {
                const isActive = seats === s;
                return (
                  <TouchableOpacity 
                    key={s}
                    style={[styles.seatBox, isActive && styles.boxActive]}
                    onPress={() => setSeats(s)}
                  >
                    <Text style={[styles.seatTxt, isActive && styles.txtActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.dividerLight} />

          </ScrollView>

          {/* ── Footer CTA ── */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnTxt}>Clear filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
              <Text style={styles.applyBtnTxt}>Apply</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
}

const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionIndicator} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  
  // Section Titles
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIndicator: {
    width: 3,
    height: 18,
    backgroundColor: BRAND,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePillActive: {
    backgroundColor: BRAND,
  },
  datePillInactive: {
    backgroundColor: BG_GRAY,
  },
  dateTxtActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateTxtInactive: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
  calBtn: {
    width: 44,
    height: 44,
    backgroundColor: BRAND,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Time Grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeBox: {
    width: '48%',
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxActive: {
    borderColor: BRAND,
  },
  timeTxt: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },
  txtActive: {
    color: BRAND,
    fontWeight: '600',
  },

  // Seats
  seatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  seatBox: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatTxt: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },

  // Footer CTA
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnTxt: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
