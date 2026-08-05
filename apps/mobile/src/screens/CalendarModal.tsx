import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#9CA3AF';
const BORDER = '#F3F4F6';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Mock calendar grid for January 2023 as shown in the screenshot
const CALENDAR_GRID = [
  [ { date: '29', type: 'prev' }, { date: '30', type: 'prev' }, { date: '31', type: 'prev' }, { date: '1', type: 'curr' }, { date: '2', type: 'curr' }, { date: '3', type: 'curr' }, { date: '4', type: 'curr' } ],
  [ { date: '5', type: 'curr' }, { date: '6', type: 'curr' }, { date: '7', type: 'curr' }, { date: '8', type: 'curr' }, { date: '9', type: 'curr' }, { date: '10', type: 'curr' }, { date: '11', type: 'curr' } ],
  [ { date: '12', type: 'curr' }, { date: '13', type: 'curr' }, { date: '14', type: 'curr' }, { date: '15', type: 'curr' }, { date: '16', type: 'curr' }, { date: '17', type: 'curr' }, { date: '18', type: 'curr' } ],
  [ { date: '19', type: 'curr' }, { date: '20', type: 'curr' }, { date: '21', type: 'curr' }, { date: '22', type: 'curr' }, { date: '23', type: 'curr' }, { date: '24', type: 'curr' }, { date: '25', type: 'curr' } ],
  [ { date: '26', type: 'curr' }, { date: '27', type: 'curr' }, { date: '28', type: 'curr' }, { date: '29', type: 'curr' }, { date: '30', type: 'curr' }, { date: '1', type: 'next' }, { date: '2', type: 'next' } ]
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CalendarModal() {
  const navigation = useNavigation<any>();

  const [selectedDate, setSelectedDate] = useState('7');

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="3" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.navBtn}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </TouchableOpacity>
            
            <Text style={styles.monthTxt}>January 2023</Text>
            
            <TouchableOpacity style={styles.navBtn}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Days of Week */}
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d, i) => (
              <Text key={i} style={styles.dayLbl}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {CALENDAR_GRID.map((row, rIdx) => (
              <View key={rIdx} style={styles.weekRow}>
                {row.map((cell, cIdx) => {
                  const isSelected = cell.type === 'curr' && cell.date === selectedDate;
                  const isCurrent = cell.type === 'curr';
                  
                  return (
                    <TouchableOpacity 
                      key={cIdx} 
                      style={[styles.dateCell, isSelected && styles.dateCellSelected]}
                      onPress={() => {
                        if (isCurrent) setSelectedDate(cell.date);
                      }}
                      activeOpacity={isCurrent ? 0.7 : 1}
                    >
                      <Text style={[
                        styles.dateTxt,
                        !isCurrent && styles.dateTxtMuted,
                        isSelected && styles.dateTxtSelected
                      ]}>
                        {cell.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
    justifyContent: 'center', // Center modal vertically
    alignItems: 'center',     // Center modal horizontally
    paddingHorizontal: 20,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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

  // Month Selector
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 20,
  },

  // Days of Week
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayLbl: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Calendar Grid
  calendarGrid: {
    marginBottom: 32,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateCell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCellSelected: {
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  dateTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  dateTxtMuted: {
    color: '#D1D5DB', // Very light gray for prev/next month dates
  },
  dateTxtSelected: {
    color: BRAND,
  },

  // Confirm Button
  confirmBtn: {
    backgroundColor: '#292B2E',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
