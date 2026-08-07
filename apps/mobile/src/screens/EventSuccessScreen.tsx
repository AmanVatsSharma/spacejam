import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';

export default function EventSuccessScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.iconCircle}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        </View>

        <Text style={styles.title}>Event Booked Successfully</Text>
        <Text style={styles.subtitle}>Your spot has been reserved.</Text>

        <TouchableOpacity 
          style={styles.returnBtn}
          onPress={() => navigation.navigate("HomeTab")}
          activeOpacity={0.7}
        >
          <Text style={styles.returnBtnTxt}>Return Home</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    marginBottom: 40,
    textAlign: 'center',
  },
  returnBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnBtnTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
  },
});
