import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_PRINT_JOB } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const YELLOW = '#FCD34D';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BG = '#fff';

type RouteParams = { printJobId?: string };

export default function PrintProcessingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as RouteParams | undefined;
  const printJobId = params?.printJobId;

  const [pollCount, setPollCount] = useState(0);

  const { data, loading, error } = useQuery(GET_PRINT_JOB, {
    variables: { id: printJobId },
    skip: !printJobId,
    pollInterval: 2000,
    fetchPolicy: 'network-only',
  });

  const job = data?.printJob;
  const status = job?.status;

  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        navigation.navigate('PrintSuccess', { printJobId });
      }, 800);
      return () => clearTimeout(timer);
    }
    if (status === 'failed' || error) {
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, error, navigation, printJobId]);

  // Safety fallback: after 60 polls (2 min), show error
  useEffect(() => {
    if (pollCount >= 60 && !status) {
      navigation.goBack();
    }
  }, [pollCount, status, navigation]);

  useEffect(() => {
    if (!loading) setPollCount(c => c + 1);
  }, [loading]);

  const label = status === 'completed'
    ? 'Print Ready!'
    : status === 'failed'
      ? 'Print Failed'
      : status === 'processing'
        ? 'Processing...'
        : 'Submitting...';

  const subtitle = status === 'completed'
    ? 'Your document is ready for pickup.'
    : status === 'failed'
      ? 'Something went wrong. Please try again.'
      : status === 'processing'
        ? 'Your printing request is being processed.'
        : 'Your printing request is being processed.';

  if (!printJobId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No print job found</Text>
        <Text style={styles.subtitle}>Please submit a print request first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <View style={styles.dash} />
        <View style={styles.dash} />
        <View style={styles.dash} />
      </View>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {!status && <Text style={styles.subtitle}>Hang tight!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dash: {
    width: 16,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  }
});
