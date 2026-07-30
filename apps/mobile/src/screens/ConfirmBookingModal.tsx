import React from 'react';
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
const MUTED = '#6F767E';
const BORDER = '#F3F4F6';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmBookingModal({ visible, onClose, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Confirm Your Booking</Text>
              <Text style={styles.headerSub}>Review the details before confirming</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Room Name</Text>
              <Text style={styles.detailVal}>Ocean View – MR-201</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Time</Text>
              <Text style={styles.detailVal}>10:00 AM - 11:00 AM</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Date</Text>
              <Text style={styles.detailVal}>May 5, 2026</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Location</Text>
              <Text style={styles.detailVal}>Belandre, Karnataka</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLbl}>Total Amount</Text>
            <Text style={styles.totalVal}>₹270</Text>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmBtnTxt}>Confirm Booking</Text>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  closeBtn: {
    padding: 4,
    marginRight: -4,
    marginTop: -4,
  },

  detailsList: {
    gap: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLbl: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  detailVal: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 24,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  totalLbl: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND,
  },

  confirmBtn: {
    backgroundColor: BRAND,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
