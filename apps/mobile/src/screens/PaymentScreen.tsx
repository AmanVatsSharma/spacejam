/**
 * File:        screens/PaymentScreen.tsx
 * Module:      Mobile · Payment · Gateway
 * Purpose:     Process a booking payment via the backend
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import { PROCESS_PAYMENT_MUTATION } from '../lib/apollo/operations';
import Toast from 'react-native-toast-message';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#F9FAFB';

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const paymentId = route.params?.paymentId;
  const amount = route.params?.amount;
  const itemName = route.params?.itemName;

  const [selectedMethod, setSelectedMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);

  const [processPayment] = useMutation(PROCESS_PAYMENT_MUTATION, {
    onCompleted: () => {
      navigation.navigate('EventSuccess');
    },
    onError: (err) => {
      setProcessing(false);
      Toast.show({ type: 'error', text1: 'Payment Failed', text2: err.message });
    }
  });

  const handlePay = () => {
    if (!paymentId) {
      Toast.show({ type: 'error', text1: 'Missing payment information' });
      return;
    }
    setProcessing(true);
    processPayment({
      variables: {
        paymentId,
        method: selectedMethod,
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Gateway</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>Order Total</Text>
          <Text style={styles.amount}>{amount != null ? `₹ ${amount}` : '₹ —'}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLbl}>Item</Text>
            <Text style={styles.rowVal}>{itemName ?? 'Item'}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'CARD' ? styles.methodActive : null]}
          activeOpacity={0.8}
          onPress={() => setSelectedMethod('CARD')}
        >
          <View style={styles.methodIconWrapper}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <Line x1="2" y1="10" x2="22" y2="10"/>
            </Svg>
          </View>
          <View style={styles.methodTexts}>
            <Text style={styles.methodTitle}>Credit / Debit Card</Text>
            <Text style={styles.methodSub}>Pay with Visa, Mastercard, RuPay</Text>
          </View>
          {selectedMethod === 'CARD' ? (
            <View style={styles.radioActive}>
              <View style={styles.radioInner} />
            </View>
          ) : (
            <View style={styles.radioInactive} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'UPI' ? styles.methodActive : null]}
          activeOpacity={0.8}
          onPress={() => setSelectedMethod('UPI')}
        >
          <View style={[styles.methodIconWrapper, { backgroundColor: '#F3F4F6' }]}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <Line x1="12" y1="18" x2="12" y2="18"/>
            </Svg>
          </View>
          <View style={styles.methodTexts}>
            <Text style={styles.methodTitle}>UPI</Text>
            <Text style={styles.methodSub}>Pay via Google Pay, PhonePe</Text>
          </View>
          {selectedMethod === 'UPI' ? (
            <View style={styles.radioActive}>
              <View style={styles.radioInner} />
            </View>
          ) : (
            <View style={styles.radioInactive} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'WALLET' ? styles.methodActive : null]}
          activeOpacity={0.8}
          onPress={() => setSelectedMethod('WALLET')}
        >
          <View style={[styles.methodIconWrapper, { backgroundColor: '#F3F4F6' }]}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <Path d="M3 12v5a2 2 0 0 0 2 2h16v-5"/>
              <Path d="M18 12a2 2 0 1 1 4 0v2h-4v-2z"/>
            </Svg>
          </View>
          <View style={styles.methodTexts}>
            <Text style={styles.methodTitle}>Wallet</Text>
            <Text style={styles.methodSub}>Pay using your SpaceJam wallet</Text>
          </View>
          {selectedMethod === 'WALLET' ? (
            <View style={styles.radioActive}>
              <View style={styles.radioInner} />
            </View>
          ) : (
            <View style={styles.radioInactive} />
          )}
        </TouchableOpacity>
        
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payBtn}
          activeOpacity={0.8}
          onPress={handlePay}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnTxt}>Pay {amount != null ? `₹ ${amount}` : '₹ —'}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.secureRow}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </Svg>
          <Text style={styles.secureTxt}>Secure Payment</Text>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  cardLbl: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: DARK,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 16,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  methodActive: {
    borderColor: BRAND,
    backgroundColor: '#FFF5F2',
  },
  methodIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  methodTexts: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  methodSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
  },
  radioInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BORDER,
  },
  radioActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  payBtn: {
    backgroundColor: '#292B2E',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  payBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secureTxt: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
});
