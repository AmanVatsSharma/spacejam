import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function NotificationSettingsScreen(): ()) {
  const navigation = useNavigation<any>();

  const [meetingReminders, setMeetingReminders] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [specialOffers, setSpecialOffers] = useState(true);
  const [eventUpdates, setEventUpdates] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style=()>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          
          {/* Item 1 */}
          <View style={styles.row}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Meeting Reminders</Text>
              <Text style={styles.subtitle}>Get notified before meetings</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: BRAND }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E5E7EB"
              onValueChange={setMeetingReminders}
              value={meetingReminders}
            />
          </View>
          <View style={styles.divider} />

          {/* Item 2 */}
          <View style={styles.row}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Billing Alerts</Text>
              <Text style={styles.subtitle}>Payment and invoice updates</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: BRAND }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E5E7EB"
              onValueChange={setBillingAlerts}
              value={billingAlerts}
            />
          </View>
          <View style={styles.divider} />

          {/* Item 3 */}
          <View style={styles.row}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Special Offers</Text>
              <Text style={styles.subtitle}>Promotions and discounts</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: BRAND }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E5E7EB"
              onValueChange={setSpecialOffers}
              value={specialOffers}
            />
          </View>
          <View style={styles.divider} />

          {/* Item 4 */}
          <View style={styles.row}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Event Updates</Text>
              <Text style={styles.subtitle}>News about upcoming events</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: BRAND }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E5E7EB"
              onValueChange={setEventUpdates}
              value={eventUpdates}
            />
          </View>
          
        </View>

      </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  textContent: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    color: DARK,
    fontWeight: '500',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
