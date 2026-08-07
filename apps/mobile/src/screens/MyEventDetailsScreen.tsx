/**
 * File:        apps/mobile/src/screens/MyEventDetailsScreen.tsx
 * Module:      Mobile · Events · MyEventDetails
 * Purpose:     Show details for a booked event pulled from the backend
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_EVENT } from '../lib/apollo/operations';
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
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function MyEventDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventId = route.params?.eventId;

  const { data, loading } = useQuery(GET_EVENT, {
    variables: { id: eventId },
    skip: !eventId,
  });

  const event = data?.event;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7"/>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingTxt}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7"/>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingTxt}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColor = event.status === 'Upcoming' ? '#E0F2FE' : '#FFF0EB';
  const statusTextColor = event.status === 'Upcoming' ? '#3B82F6' : BRAND;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.tag, { backgroundColor: statusColor }]}>
              <Text style={[styles.tagTxt, { color: statusTextColor }]}>
                {event.status || 'Event'}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#FFF0EB' }]}>
              <Text style={[styles.tagTxt, { color: BRAND }]}>
                {event.eventType || 'Event'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{event.title || 'Event'}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Venue</Text>
            <Text style={styles.rowVal}>{event.meetingRoom?.name || 'Venue TBD'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Date</Text>
            <Text style={styles.rowVal}>{formatDate(event.eventDate)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Start time</Text>
            <Text style={styles.rowVal}>{event.startTime || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>End time</Text>
            <Text style={styles.rowVal}>{event.endTime || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Attendees</Text>
            <Text style={styles.rowVal}>
              {event.attendeesCount != null ? `${event.attendeesCount} people` : 'N/A'}
            </Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingTxt: {
    fontSize: 16,
    color: MUTED,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
});
