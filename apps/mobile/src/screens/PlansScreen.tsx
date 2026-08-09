/**
 * File:        apps/mobile/src/screens/PlansScreen.tsx
 * Module:      Mobile · Screens · Plans (monthly-seat flow)
 * Purpose:     Customer-facing monthly-seat flow: browse a center's active
 *              plans (the M2 model) and subscribe to one. The backend (M3)
 *              then allocates a seat and generates the monthly booking +
 *              invoice on the next billing run. Also shows any existing
 *              subscriptions so an employee/customer can see their seat.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import {
  GET_PLANS,
  GET_MY_SUBSCRIPTIONS,
  CREATE_SUBSCRIPTION,
} from '../lib/apollo/operations';
import { GET_ME, GET_MY_CENTERS } from '../lib/apollo/operations';
import { useAuth } from '../lib/auth/context';

import { palette, space, radius, duration } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback } from '../theme/animations';

const SEAT_TYPE_LABEL: Record<string, string> = {
  HOT_DESK: 'Hot Desk',
  DEDICATED: 'Dedicated Desk',
  CABIN: 'Cabin',
  MEETING_ROOM: 'Meeting Room',
};
const CYCLE_LABEL: Record<string, string> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
};
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: palette.brand,
  SUSPENDED: palette.muted,
  CANCELLED: palette.mutedSoft,
  PENDING: palette.teal,
};

export default function PlansScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const { data: centersData } = useQuery(GET_MY_CENTERS);
  const centerId = centersData?.myCenters?.[0]?.id;

  const { data: meData } = useQuery(GET_ME);
  // A walk-in customer has no Customer record; subscriptions need a customerId.
  // The backend resolves the customer by phone, so we pass the me.id only if
  // present. For now we surface plans + existing subscriptions; subscribing
  // is enabled once a customerId is known (company-admin/employee path).
  const customerId = (meData as any)?.me?.customerId ?? null;

  const { data: plansData, loading: plansLoading } = useQuery(GET_PLANS, {
    variables: { centerId },
    skip: !centerId,
  });
  const { data: subsData } = useQuery(GET_MY_SUBSCRIPTIONS);

  const [createSub, { loading: subscribing }] = useMutation(CREATE_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTIONS }],
    onCompleted: () => {
      (require('react-native')).ToastAndroid.show(
        'Subscribed! Your seat will be allocated on the next billing run.',
        200,
      );
      navigation.navigate('HomeTab');
    },
    onError: (err) => {
      (require('react-native')).ToastAndroid.show(
        err.message || 'Could not subscribe',
        3000,
      );
    },
  });

  const headerSlide = useSlideIn('down', 0, 16, duration.slow);
  const plans = plansData?.plans ?? [];
  const subs = subsData?.subscriptions ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={headerSlide}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Plans</Text>
            <Text style={styles.headerSub}>
              {centerId
                ? `Monthly seats at ${centersData?.myCenters?.[0]?.name ?? 'your center'}`
                : 'Loading your center…'}
            </Text>
          </View>
        </Animated.View>

        {/* Existing subscriptions */}
        {subs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your subscription</Text>
            {subs.map((s: any, i: number) => (
              <SubCard key={s.id} sub={s} index={i} />
            ))}
          </View>
        )}

        {/* Available plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available plans</Text>
          {plansLoading ? (
            <ActivityIndicator color={palette.brand} style={{ padding: 24 }} />
          ) : plans.length === 0 ? (
            <Text style={styles.empty}>No plans available at this center yet.</Text>
          ) : (
            plans.map((p: any, i: number) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                canSubscribe={!!customerId}
                subscribing={subscribing}
                onSubscribe={() =>
                  createSub({
                    variables: {
                      customerId,
                      planId: p.id,
                      seatCount: Math.max(1, p.minSeats ?? 1),
                      startDate: new Date().toISOString(),
                    },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Plan card ──────────────────────────────────────────────────────────────
const PlanCard = ({ plan, index, canSubscribe, subscribing, onSubscribe }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 100, 60), { fromY: 12 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.98 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: space.md }}>
      <View style={styles.planCard}>
        <View style={styles.planHead}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>
            ₹{Number(plan.price).toLocaleString('en-IN')}
            <Text style={styles.planCycle}> /{CYCLE_LABEL[plan.billingCycle] ?? 'cycle'}</Text>
          </Text>
        </View>
        <Text style={styles.planType}>{SEAT_TYPE_LABEL[plan.seatType] ?? plan.seatType}</Text>
        {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
        <TouchableWithoutFeedback
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={canSubscribe ? onSubscribe : undefined}
          disabled={!canSubscribe || subscribing}
        >
          <Animated.View
            style={[styles.subscribeBtn, (!canSubscribe || subscribing) && { opacity: 0.5 }]}
          >
            <Text style={styles.subscribeTxt}>
              {subscribing ? 'Subscribing…' : canSubscribe ? 'Subscribe' : 'Ask your company admin'}
            </Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Animated.View>
  );
};

// ─── Subscription card ──────────────────────────────────────────────────────
const SubCard = ({ sub, index }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 100, 60), { fromY: 12 });
  const color = STATUS_BADGE[sub.status] ?? palette.muted;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: space.md }}>
      <View style={styles.subCard}>
        <View style={styles.subHead}>
          <Text style={styles.subPlan}>{sub.plan?.name ?? 'Plan'}</Text>
          <View style={[styles.subBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.subBadgeTxt, { color }]}>{sub.status}</Text>
          </View>
        </View>
        <Text style={styles.subMeta}>
          {sub.seatCount} seat(s) · ₹{Number(sub.amount).toLocaleString('en-IN')} ·{' '}
          renews {new Date(sub.nextBillingDate).toLocaleDateString()}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { padding: space.lg, paddingBottom: 120 },
  header: { marginBottom: space.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: palette.ink },
  headerSub: { fontSize: 14, color: palette.muted, marginTop: 4 },
  section: { marginTop: space.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.ink, marginBottom: space.md },
  empty: { fontSize: 14, color: palette.muted, padding: 8 },
  planCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
  },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 17, fontWeight: '700', color: palette.ink, flex: 1, marginRight: 8 },
  planPrice: { fontSize: 16, fontWeight: '700', color: palette.brand },
  planCycle: { fontSize: 12, fontWeight: '500', color: palette.muted },
  planType: { fontSize: 13, color: palette.muted, marginTop: 4 },
  planDesc: { fontSize: 13, color: palette.muted, marginTop: 8 },
  subscribeBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  subscribeTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  subHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subPlan: { fontSize: 16, fontWeight: '700', color: palette.ink, flex: 1 },
  subBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  subBadgeTxt: { fontSize: 11, fontWeight: '700' },
  subMeta: { fontSize: 13, color: palette.muted, marginTop: 8 },
});
