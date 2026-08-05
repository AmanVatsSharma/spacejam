import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME, RECHARGE_WALLET_MUTATION } from '../lib/apollo/operations';
import Toast from 'react-native-toast-message';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND = '#FE7A47';
const BRAND_LIGHT = '#FFF0EB';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function RechargeTokensScreen() {
  const navigation = useNavigation<any>();
  const { data } = useQuery(GET_ME);
  const currentTokens = data?.me?.tokenBalance || 0;

  const [amount, setAmount] = useState('500');

  const [rechargeWallet, { loading }] = useMutation(RECHARGE_WALLET_MUTATION, {
    onCompleted: () => {
      Toast.show({ type: 'success', text1: 'Recharge Successful' });
      navigation.goBack();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Recharge Failed', text2: err.message });
    }
  });

  const handleRecharge = () => {
    rechargeWallet({ variables: { amount: parseInt(amount, 10) } });
  };

  const handleKeyPress = (val: string) => {
    if (val === 'delete') {
      setAmount(prev => prev.slice(0, -1) || '0');
    } else {
      setAmount(prev => (prev === '0' ? val : prev + val));
    }
  };

  const quickAmounts = ['100', '500', '1000', '2000'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recharge Tokens</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Balance Status */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.tokensPill}>
              <Text style={styles.tokensPillTxt}>Tokens</Text>
            </View>
          </View>
          <Text style={styles.balanceVal}>{currentTokens}</Text>
          <Text style={styles.balanceSubtext}>Your available balance</Text>
        </View>

        {/* Input Area */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Enter Amount</Text>
          <View style={styles.inputBox}>
            <Text style={styles.amountTxt}>{amount}</Text>
            <Text style={styles.currencyTxt}>Tokens</Text>
          </View>
          
          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity key={amt} style={styles.quickAmtBtn} onPress={() => setAmount(amt)}>
                <Text style={styles.quickAmtTxt}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Quick & Secure</Text>
          <Text style={styles.infoText}>Tokens will be added instantly to your account after payment.</Text>
        </View>

        <TouchableOpacity 
          style={styles.proceedBtn} 
          activeOpacity={0.8}
          onPress={handleRecharge}
          disabled={loading}
        >
          <Text style={styles.proceedBtnTxt}>{loading ? 'Processing...' : `Proceed to Pay ₹${amount}`}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Custom Keypad */}
      <View style={styles.keypadContainer}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, i) => (
          <View key={i} style={styles.keypadRow}>
            {row.map(num => (
              <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleKeyPress(num)}>
                <Text style={styles.keyTxt}>{num}</Text>
                {/* Optional subtexts for keys (like ABC, DEF) can be added here if desired */}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.keypadRow}>
          <View style={styles.keyBtnEmpty}>
            <Text style={styles.keySpecial}>+ * #</Text>
          </View>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyTxt}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('delete')}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <Path d="M18 9l-6 6" />
              <Path d="M12 9l6 6" />
            </Svg>
          </TouchableOpacity>
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
    paddingBottom: 20,
  },
  balanceCard: {
    backgroundColor: BRAND,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tokensPill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tokensPillTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceVal: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  
  inputCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  amountTxt: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0A1B3F',
  },
  currencyTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND,
    marginLeft: 8,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmtBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmtTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },

  infoBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
  },

  proceedBtn: {
    backgroundColor: BRAND,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  proceedBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Keypad
  keypadContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingBottom: 24,
    paddingTop: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keyBtn: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  keyBtnEmpty: {
    flex: 1,
    marginHorizontal: 4,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyTxt: {
    fontSize: 24,
    color: DARK,
  },
  keySpecial: {
    fontSize: 18,
    color: DARK,
  }
});
