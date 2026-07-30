import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import CalendarModal from './CalendarModal';
import ConfirmBookingModal from './ConfirmBookingModal';

const BRAND = '#FE7A47';
const TEAL = '#48C9B0';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#F3F4F6';
const BG_GRAY = '#F9FAFB';

const DATES = [
  { day: 'M', num: '5' },
  { day: 'T', num: '6' },
  { day: 'W', num: '7' },
  { day: 'T', num: '8' },
  { day: 'F', num: '9' },
  { day: 'S', num: '10' },
];

const TIME_SLOTS = [
  { time: '9:00 AM', status: 'selected' },
  { time: '10:00 AM', status: 'available' },
  { time: '11:00 AM', status: 'booked' },
  { time: '12:00 PM', status: 'booked' },
  { time: '1:00 PM', status: 'available' },
  { time: '2:00 PM', status: 'available' },
  { time: '3:00 PM', status: 'booked' },
  { time: '4:00 PM', status: 'booked' },
  { time: '5:00 PM', status: 'available' },
  { time: '6:00 PM', status: 'available' },
];

export default function BookingDetailsScreen({ onBack }: { onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState('5');
  const [participants, setParticipants] = useState(8);
  const [showCalendar, setShowCalendar] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true); // Toggle this for testing
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select time and Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Room Summary ── */}
        <View style={styles.card}>
          <View style={styles.roomRow}>
            <View style={styles.roomThumb} />
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>MR-Ocean View - MR-201</Text>
              <Text style={styles.roomSub}>Capacity: 8 people • 2nd Floor</Text>
            </View>
          </View>
          <View style={styles.amenities}>
            <View style={styles.amenityPill}><Text style={styles.amenityTxt}>WiFi</Text></View>
            <View style={styles.amenityPill}><Text style={styles.amenityTxt}>Display</Text></View>
            <View style={styles.amenityPill}><Text style={styles.amenityTxt}>Board</Text></View>
          </View>
        </View>

        {/* ── Select Date ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity 
              style={styles.otherDatesBtn}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.otherDatesTxt}>Other dates</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <Line x1="16" y1="2" x2="16" y2="6" />
                <Line x1="8" y1="2" x2="8" y2="6" />
                <Line x1="3" y1="10" x2="21" y2="10" />
              </Svg>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {DATES.map((d, i) => {
              const isActive = selectedDate === d.num;
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.dateBox, isActive && styles.dateBoxActive]}
                  onPress={() => setSelectedDate(d.num)}
                >
                  <Text style={[styles.dateDay, isActive && styles.dateTxtActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, isActive && styles.dateTxtActive]}>{d.num}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Select Time Slot ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Select Time Slot</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot, i) => {
              let boxStyle = styles.timeBoxAvail;
              let txtStyle = styles.timeTxtAvail;
              if (slot.status === 'selected') {
                boxStyle = styles.timeBoxSelected;
                txtStyle = styles.timeTxtSelected;
              } else if (slot.status === 'booked') {
                boxStyle = styles.timeBoxBooked;
                txtStyle = styles.timeTxtBooked;
              }

              return (
                <TouchableOpacity key={i} style={[styles.timeBox, boxStyle]} activeOpacity={0.7}>
                  <Text style={[styles.timeTxt, txtStyle]}>{slot.time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: TEAL }]} />
              <Text style={styles.legendTxt}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BRAND }]} />
              <Text style={styles.legendTxt}>Booked</Text>
            </View>
          </View>
        </View>

        {/* ── Meeting Purpose ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Meeting Purpose</Text>
          <TouchableOpacity style={styles.dropdownBtn}>
            <View />
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="6 9 12 15 18 9" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Number of Participants ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Number of Participants</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity 
              style={styles.counterBtn}
              onPress={() => setParticipants(Math.max(1, participants - 1))}
            >
              <Text style={styles.counterBtnTxt}>-</Text>
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterVal}>{participants}</Text>
              <Text style={styles.counterLbl}>people</Text>
            </View>
            <TouchableOpacity 
              style={styles.counterBtn}
              onPress={() => setParticipants(participants + 1)}
            >
              <Text style={styles.counterBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Additional Requirements ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Additional Requirements</Text>
          <TextInput 
            style={styles.textArea}
            placeholder="Type your special requirements here..."
            placeholderTextColor={MUTED}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Coupon Code ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 12, textDecorationLine: 'underline' }]}>Coupon Code</Text>
          <View style={styles.inputBox} />
        </View>

        {/* ── Insufficient Tokens Warning ── */}
        {!hasSufficientBalance && (
          <View style={[styles.card, { borderColor: '#FEE2E2', backgroundColor: '#fff' }]}>
            <View style={styles.warningRow}>
              <View style={styles.warningIconBox}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="12" y1="8" x2="12" y2="12" />
                  <Line x1="12" y1="16" x2="12.01" y2="16" />
                </Svg>
              </View>
              <View style={styles.warningInfo}>
                <Text style={styles.warningTitle}>Insufficient Tokens</Text>
                <Text style={styles.warningSub}>You need 500 tokens but you have only 250. Please recharge to continue.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.warningBtn}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Line x1="12" y1="8" x2="12" y2="16" />
                <Line x1="8" y1="12" x2="16" y2="12" />
              </Svg>
              <Text style={styles.warningBtnTxt}>Click to Recharge</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLbl}>Token Balance</Text>
          <View style={styles.footerBalRow}>
            <Text style={styles.footerBalBold}>{hasSufficientBalance ? '500' : '250'}</Text>
            <Text style={styles.footerBalSub}>{hasSufficientBalance ? ' / 750' : ' / ₹500'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.rechargeBtn}
          onPress={() => {
            if (hasSufficientBalance) {
              setShowConfirmModal(true);
            } else {
              // Handle recharge
            }
          }}
        >
          {!hasSufficientBalance && (
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Line x1="12" y1="8" x2="12" y2="16" />
              <Line x1="8" y1="12" x2="16" y2="12" />
            </Svg>
          )}
          <Text style={styles.rechargeBtnTxt}>
            {hasSufficientBalance ? 'Book Space' : 'Recharge Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} />
      <ConfirmBookingModal 
        visible={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          // Navigate to success or home
          onBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Base Card
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },

  // Room Summary
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  roomSub: {
    fontSize: 12,
    color: MUTED,
  },
  amenities: {
    flexDirection: 'row',
    gap: 12,
  },
  amenityPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFE0D3', // light orange border
    borderRadius: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityTxt: {
    color: BRAND,
    fontSize: 12,
    fontWeight: '600',
  },

  // Select Date
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otherDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otherDatesTxt: {
    fontSize: 12,
    color: MUTED,
  },
  dateScroll: {
    gap: 10,
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
    color: MUTED,
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  dateTxtActive: {
    color: '#fff',
  },

  // Select Time Slot
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeBox: {
    width: '48%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timeBoxSelected: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  timeTxtSelected: {
    color: '#fff',
  },
  timeBoxAvail: {
    backgroundColor: '#fff',
    borderColor: TEAL,
  },
  timeTxtAvail: {
    color: TEAL,
  },
  timeBoxBooked: {
    backgroundColor: '#fff',
    borderColor: '#FFC8B4', // lighter orange border
  },
  timeTxtBooked: {
    color: BRAND,
  },
  timeTxt: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendTxt: {
    fontSize: 12,
    color: MUTED,
  },

  // Meeting Purpose
  dropdownBtn: {
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Participants
  counterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counterBtn: {
    width: 48,
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnTxt: {
    fontSize: 20,
    color: DARK,
    fontWeight: '500',
  },
  counterDisplay: {
    flex: 1,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  counterVal: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  counterLbl: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Text Area
  textArea: {
    height: 100,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: DARK,
  },
  
  inputBox: {
    height: 48,
    backgroundColor: BG_GRAY,
    borderRadius: 12,
  },

  // Warning
  warningRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  warningIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warningInfo: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  warningSub: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },
  warningBtn: {
    backgroundColor: BRAND,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  warningBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLbl: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  footerBalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerBalBold: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND,
  },
  footerBalSub: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  rechargeBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
