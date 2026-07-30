import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function AddTokensPaymentScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Tokens</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View>
            <Text style={styles.amountLabel}>Payment Amount</Text>
            <Text style={styles.amountSub}>Add tokens to your account</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountVal}>₹500</Text>
            <Text style={styles.gstTxt}>+ GST</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
            <Path d="M2 10h20"/>
          </Svg>
          <Text style={styles.sectionTitle}>Pay by any UPI app</Text>
        </View>

        {/* UPI Apps List */}
        <View style={styles.upiList}>
          {/* Paytm */}
          <View style={styles.upiItem}>
            <View style={styles.upiIconBox}>
              <View style={[styles.upiIconPlaceholder, { backgroundColor: '#00B9F1' }]} />
            </View>
            <View style={styles.upiDetails}>
              <Text style={styles.upiName}>Paytm</Text>
              <Text style={styles.upiType}>UPI Payment</Text>
            </View>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill={BRAND}>
              <Circle cx="12" cy="12" r="10" />
              <Path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
          <View style={styles.divider} />
          
          {/* Google Pay */}
          <View style={styles.upiItem}>
            <View style={styles.upiIconBox}>
              <View style={styles.upiIconPlaceholder} />
            </View>
            <View style={styles.upiDetails}>
              <Text style={styles.upiName}>Google Pay</Text>
              <Text style={styles.upiType}>UPI Payment</Text>
            </View>
            <View style={styles.radioEmpty} />
          </View>
          <View style={styles.divider} />

          {/* PhonePe */}
          <View style={styles.upiItem}>
            <View style={styles.upiIconBox}>
              <View style={[styles.upiIconPlaceholder, { backgroundColor: '#5F259F' }]} />
            </View>
            <View style={styles.upiDetails}>
              <Text style={styles.upiName}>PhonePe</Text>
              <Text style={styles.upiType}>UPI Payment</Text>
            </View>
            <View style={styles.radioEmpty} />
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityBox}>
          <View style={styles.securityIconBox}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Secure Payment</Text>
            <Text style={styles.securityText}>Your payment information is encrypted and secure. We never store your card details.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLbl}>Total Amount</Text>
          <Text style={styles.totalVal}>₹590.00</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={() => onNavigate('Home')}>
          <Text style={styles.payBtnTxt}>Proceed to Pay</Text>
        </TouchableOpacity>
      </View>
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
  
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  amountSub: {
    fontSize: 13,
    color: MUTED,
  },
  amountVal: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND,
  },
  gstTxt: {
    fontSize: 12,
    color: MUTED,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    marginLeft: 10,
  },

  upiList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  upiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  upiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  upiIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  upiDetails: {
    flex: 1,
  },
  upiName: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginBottom: 2,
  },
  upiType: {
    fontSize: 13,
    color: MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56,
  },
  radioEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  securityBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
  },
  securityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#fff',
  },
  totalLbl: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
  },
  payBtn: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
