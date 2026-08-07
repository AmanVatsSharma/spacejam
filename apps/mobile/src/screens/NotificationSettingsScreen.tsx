import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
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
import Toast from 'react-native-toast-message';

import {
  GET_MY_NOTIFICATION_PREFERENCES,
  UPDATE_NOTIFICATION_PREFERENCES,
} from '../lib/apollo/operations';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const [saving, setSaving] = useState(false);

  const { data, loading } = useQuery(GET_MY_NOTIFICATION_PREFERENCES);

  const [meetingReminders, setMeetingReminders] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [specialOffers, setSpecialOffers] = useState(true);
  const [eventUpdates, setEventUpdates] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Initialize local state from backend once data arrives
  React.useEffect(() => {
    if (data?.myNotificationPreferences && !hasLoaded) {
      const prefs = data.myNotificationPreferences;
      setMeetingReminders(prefs.meetingReminders ?? true);
      setBillingAlerts(prefs.billingAlerts ?? true);
      setSpecialOffers(prefs.specialOffers ?? true);
      setEventUpdates(prefs.eventUpdates ?? true);
      setHasLoaded(true);
    }
  }, [data, hasLoaded]);

  const [updatePrefs] = useMutation(UPDATE_NOTIFICATION_PREFERENCES, {
    onCompleted: () => {
      Toast.show({ type: 'success', text1: 'Preferences saved' });
      setSaving(false);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Save failed', text2: err.message });
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    updatePrefs({
      variables: {
        input: {
          meetingReminders,
          billingAlerts,
          specialOffers,
          eventUpdates,
        },
      },
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
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {loading ? (
          <Text style={styles.loadingText}>Loading preferences...</Text>
        ) : (
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
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving || loading}
        >
          <Text style={styles.saveBtnTxt}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

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
  loadingText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  saveBtn: {
    backgroundColor: BRAND,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
