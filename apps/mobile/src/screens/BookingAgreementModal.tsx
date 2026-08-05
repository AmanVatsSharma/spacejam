import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Rect, Polyline, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';

export default function BookingAgreementModal() {
  const navigation = useNavigation<any>();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Polyline points="14 2 14 8 20 8" />
                <Line x1="16" y1="13" x2="8" y2="13" />
                <Line x1="16" y1="17" x2="8" y2="17" />
                <Polyline points="10 9 9 9 8 9" />
              </Svg>
            </View>
            <View style={styles.headerTitleBox}>
              <Text style={styles.title}>Booking Agreement</Text>
              <Text style={styles.subtitle}>#676 · {invoice?.title || 'Meeting Room A'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.invoiceDoc}>
              
              {/* Doc Header */}
              <View style={styles.docHeader}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoTxt}>SPACE{'\n'}JAM</Text>
                  <Text style={styles.logoSubTxt}>co-working{'\n'}offices</Text>
                </View>
              </View>

              {/* Doc Body */}
              <View style={styles.docBody}>
                <Text style={styles.docTitle}>BOOKING AGREEMENT</Text>
                <Text style={styles.docSub}>Invoice #676 · {invoice?.title || 'Meeting Room A'}</Text>

                <Text style={styles.para}>
                  SPACEJAM WORKSPACE — BOOKING AGREEMENT{'\n'}
                  Invoice #676
                </Text>

                <Text style={styles.para}>
                  This agreement is entered into between SpaceJam Co-working Offices (hereinafter "SpaceJam") and the member named below, in respect of the workspace booking described herein.
                </Text>

                <Text style={styles.sectionTitle}>MEMBER DETAILS</Text>
                <Text style={styles.para}>
                  Name: Ms. Dikshita Bansal{'\n'}
                  Email: bansal.dikshita04@gmail.com{'\n'}
                  GST IN: 03BWVPB2164C1ZW
                </Text>

                <Text style={styles.sectionTitle}>BOOKING DETAILS</Text>
                <Text style={styles.para}>
                  Room / Space: {invoice?.title || 'Meeting Room A'}{'\n'}
                  Date: Jan 18, 2026{'\n'}
                  Time: 10:00 AM{'\n'}
                  Duration: 1 hour{'\n'}
                  Participants: 8 people{'\n'}
                  Invoice Amount: ₹300
                </Text>

                <Text style={styles.sectionTitle}>1. BOOKING CONFIRMATION</Text>
                <Text style={styles.para}>
                  This booking is confirmed upon receipt of full payment. SpaceJam reserves the right to cancel bookings in case of non-payment or breach of terms.
                </Text>

                <Text style={styles.sectionTitle}>2. USAGE POLICY</Text>
                <Text style={styles.para}>
                  The member agrees to use the booked space solely for legitimate business purposes. Sub-letting or sharing access with non-registered individuals is strictly prohibited.
                </Text>
              </View>
            </View>
          </ScrollView>

          <SafeAreaView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.dlBtn} activeOpacity={0.8}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <Polyline points="7 10 12 15 17 10" />
                  <Line x1="12" y1="15" x2="12" y2="3" />
                </Svg>
                <Text style={styles.dlBtnTxt}>Download Agreement PDF</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  invoiceDoc: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  docHeader: {
    backgroundColor: BRAND,
    padding: 24,
    alignItems: 'flex-end', // Logo on right
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoTxt: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  logoSubTxt: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 11,
  },
  docBody: {
    padding: 24,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  docSub: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  para: {
    fontSize: 12,
    color: DARK,
    lineHeight: 18,
    marginBottom: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  dlBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dlBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  }
});
