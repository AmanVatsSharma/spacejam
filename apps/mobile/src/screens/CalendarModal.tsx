import React, { useState, useMemo } from 'react';
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

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildCalendarGrid(year: number, month: number): { date: string; type: 'prev'|'curr'|'next' }[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const grid: { date: string; type: 'prev'|'curr'|'next' }[][] = [];
  let row: { date: string; type: 'prev'|'curr'|'next' }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    row.push({ date: String(daysInPrev - i), type: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    row.push({ date: String(d), type: 'curr' });
    if (row.length === 7) { grid.push(row); row = []; }
  }
  if (row.length > 0) {
    for (let d = 1; row.length < 7; d++) {
      row.push({ date: String(d), type: 'next' });
    }
    grid.push(row);
  }
  return grid;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectDate?: (dateNum: string) => void;
}

export default function CalendarModal({ visible, onClose, onSelectDate }: Props) {
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState('');

  const calendarGrid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const handlePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleConfirm = () => {
    if (selectedDate && onSelectDate) onSelectDate(selectedDate);
    onClose();
  };

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

          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.monthTxt}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>

            <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d, i) => (
              <Text key={i} style={styles.dayLbl}>{d}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarGrid.map((row, rIdx) => (
              <View key={rIdx} style={styles.weekRow}>
                {row.map((cell, cIdx) => {
                  const isSelected = cell.type === 'curr' && cell.date === selectedDate;
                  const isCurrent = cell.type === 'curr';
                  return (
                    <TouchableOpacity
                      key={cIdx}
                      style={[styles.dateCell, isSelected && styles.dateCellSelected]}
                      onPress={() => { if (isCurrent) setSelectedDate(cell.date); }}
                      activeOpacity={isCurrent ? 0.7 : 1}
                    >
                      <Text style={[
                        styles.dateTxt,
                        !isCurrent && styles.dateTxtMuted,
                        isSelected && styles.dateTxtSelected,
                      ]}>
                        {cell.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#D1D5DB',
  },
  dateTxtSelected: {
    color: BRAND,
  },
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
