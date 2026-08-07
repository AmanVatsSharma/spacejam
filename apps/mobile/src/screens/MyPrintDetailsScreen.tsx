/**
 * File:        screens/MyPrintDetailsScreen.tsx
 * Module:      Mobile · Print · MyPrintDetails
 * Purpose:     Display a single print job's details from the backend
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_PRINT_JOB } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function MyPrintDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const printJobId = route.params?.printJobId;

  const { data, loading } = useQuery(GET_PRINT_JOB, {
    variables: { id: printJobId },
    skip: !printJobId,
  });

  const job = data?.printJob;

  const statusColor = job?.status === 'COMPLETED' ? '#D1FAE5' : job?.status === 'FAILED' ? '#FEE2E2' : '#E0F2FE';
  const statusLabel = job?.status || 'Requested';
  const statusTextColor = job?.status === 'COMPLETED' ? '#065F46' : job?.status === 'FAILED' ? '#991B1B' : '#1D4ED8';
  const colorLabel = job?.color ? 'Color' : 'Black & White';
  const sidesLabel = job?.sides === 'single' ? 'Single Sided' : job?.sides === 'double' ? 'Double Sided' : job?.sides || '—';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7"/>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Print Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Print Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.tag, { backgroundColor: statusColor }]}>
              <Text style={[styles.tagTxt, { color: statusTextColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.title}>{job?.fileName || 'Print Job'}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Total Pages</Text>
            <Text style={styles.rowVal}>{job?.pages ?? '—'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Doc Type</Text>
            <Text style={styles.rowVal}>{job?.fileName?.split('.').pop()?.toUpperCase() || '—'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Page Size</Text>
            <Text style={styles.rowVal}>{job?.paperSize || 'A4'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Print Type</Text>
            <Text style={styles.rowVal}>{colorLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Copies</Text>
            <Text style={styles.rowVal}>{job?.copies ?? '—'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Sides</Text>
            <Text style={styles.rowVal}>{sidesLabel}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLbl}>Cost</Text>
            <Text style={styles.rowVal}>{job?.cost != null ? `₹${job.cost}` : '—'}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'flex-start',
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
