/**
 * File:        apps/mobile/src/screens/WalletScreen.tsx
 * Module:      Mobile · Screens · Wallet
 * Purpose:     Animated wallet screen with counter animation, balance card polish, and staggered history rows
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_ME, GET_MY_WALLET_TRANSACTIONS } from '../lib/apollo/operations';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
} from 'react-native';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { StatusPill } from '../components/StatusPill';

import { palette, space, radius, elevation } from '../theme/tokens';
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback, useSpringEntrance } from '../theme/animations';
import StatementModal from './StatementModal';

export default function WalletScreen() {
  const navigation = useNavigation<any>();

  const { data } = useQuery(GET_ME);
  const currentTokens = data?.me?.tokenBalance || 0;

  const [showStatementModal, setShowStatementModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: walletData, loading } = useQuery(GET_MY_WALLET_TRANSACTIONS, {
    variables: { limit: 20 },
  });

  // TODO: Backend query supports filtering by type — wire filter pills to pass `type` variable when backend filter is needed

  const rawTransactions = walletData?.myWalletTransactions ?? [];

  const history = rawTransactions.map((tx) => {
    const isCredit = tx.type === 'credit';
    const date = new Date(tx.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      id: tx.id,
      type: tx.type as 'credit' | 'debit',
      title: tx.description || tx.reference || 'Wallet Transaction',
      date: formattedDate,
      tag: 'Wallet',
      amount: `${isCredit ? '+' : '-'}${tx.amount} tok`,
    };
  });

  // Apply UI-only filter (backend filter not yet wired — see TODO above)
  const filteredHistory =
    activeFilter === 'All'
      ? history
      : history.filter((item) => item.type === activeFilter.toLowerCase());

  return (
    <View style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <BackBar onPress={() => navigation.goBack()} title="My Wallet" />

        <BalanceCard balance={currentTokens} onBuy={() => navigation.navigate('RechargeTokens')} onStatement={() => setShowStatementModal(true)} />

        <Animated.View style={useFadeIn(400, { fromY: 8 })}>
          <Text style={styles.historyTitle}>Transaction History</Text>
        </Animated.View>

        <Animated.View style={useFadeIn(450, { fromY: 8 })}>
          <View style={styles.filterRow}>
            {['All', 'Credit', 'Debit'].map((filter, i) => (
              <FilterPill
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onPress={() => setActiveFilter(filter)}
                index={i}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={styles.historyList}>
          {loading ? (
            <Text style={styles.loadingText}>Loading transactions...</Text>
          ) : filteredHistory.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            filteredHistory.map((item, i) => (
              <HistoryRow key={item.id} item={item} index={i} />
            ))
          )}
        </View>
      </ScrollView>

      <StatementModal visible={showStatementModal} onClose={() => setShowStatementModal(false)} />
    </View>
  );
}

// ─── Back Bar ─────────────────────────────────────────────────────────────────

const BackBar = ({ onPress, title }: { onPress: () => void; title: string }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.88, speed: 80 });
  const { opacity, translateY } = useFadeIn(0, { fromY: -8 });

  return (
    <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.88 : 1 }] }}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </Animated.View>
      </TouchableWithoutFeedback>
      <Text style={styles.headerTitle}>{title}</Text>
    </Animated.View>
  );
};

// ─── Balance Card with counter animation ──────────────────────────────────────

const BalanceCard = ({ balance, onBuy, onStatement }: { balance: number; onBuy: () => void; onStatement: () => void }) => {
  const { scale, opacity } = useSpringEntrance(200);
  const counter = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const listener = counter.addListener(({ value }) => {
      setDisplay(Math.round(value).toLocaleString());
    });
    Animated.timing(counter, {
      toValue: balance,
      duration: 1200,
      useNativeDriver: false,
    }).start();
    return () => counter.removeListener(listener);
  }, [balance]);

  return (
    <Animated.View style={[styles.walletCardWrap, { opacity, transform: [{ scale }] }]}>
      <PolishedCard
        elevation="brand"
        borderRadius={24}
        style={{ backgroundColor: palette.brand }}
      >
        <View style={styles.walletCard}>
          <View style={styles.walletCardHeader}>
            <View>
              <Text style={styles.walletCardLabel}>Token Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{display}</Text>
                <Text style={styles.balanceUnit}>tokens</Text>
              </View>
            </View>
            <View style={styles.walletIconCircle}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </Svg>
            </View>
          </View>

          <View style={styles.walletActions}>
            <ActionBtn label="Buy Tokens" onPress={onBuy} variant="solid" />
            <ActionBtn label="Statement" onPress={onStatement} variant="ghost" />
          </View>
        </View>
      </PolishedCard>
    </Animated.View>
  );
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

const FilterPill = ({ label, active, onPress, index }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 80 });
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 500, 60), { fromY: 8 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.96 : 1 }] }}>
          <View style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}>
            <Text style={[styles.filterPillTxt, active ? styles.filterPillTxtActive : null]}>{label}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── History Row ──────────────────────────────────────────────────────────────

const HistoryRow = ({ item, index }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 550, 80), { fromY: 12 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 80 });

  const isDebit = item.type === 'debit';
  const variant = isDebit ? 'ongoing' : 'upcoming';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
        <PolishedCard elevation="subtle" borderRadius={radius.lg}>
          <View style={styles.historyItem}>
            <View style={[styles.historyIconBox, { backgroundColor: isDebit ? '#FFF0EB' : '#E8F5E9' }]}>
              {isDebit ? (
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="7" y1="17" x2="17" y2="7" />
                  <Polyline points="7 7 17 7 17 17" />
                </Svg>
              ) : (
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="17" y1="7" x2="7" y2="17" />
                  <Polyline points="17 17 7 17 7 7" />
                </Svg>
              )}
            </View>

            <View style={styles.historyContent}>
              <Text style={styles.historyItemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.historyItemDate}>{item.date}</Text>
              <View style={{ marginTop: 6 }}>
                <StatusPill label={item.tag} variant={variant} size="sm" />
              </View>
            </View>

            <Text
              style={[
                styles.historyAmount,
                { color: isDebit ? palette.brand : '#22C55E' },
              ]}
            >
              {item.amount}
            </Text>
          </View>
        </PolishedCard>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionBtn = ({ label, onPress, variant }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 100 });
  const isSolid = variant === 'solid';
  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[isSolid ? styles.buyBtn : styles.statementBtn, { transform: [{ scale: pressIn ? 0.96 : 1 }] }]}>
        {isSolid ? (
          <>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Line x1="12" y1="5" x2="12" y2="19" />
              <Line x1="5" y1="12" x2="19" y2="12" />
            </Svg>
            <Text style={styles.buyBtnTxt}>{label}</Text>
          </>
        ) : (
          <>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <Polyline points="7 10 12 15 17 10" />
              <Line x1="12" y1="15" x2="12" y2="3" />
            </Svg>
            <Text style={styles.statementBtnTxt}>{label}</Text>
          </>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    marginLeft: 8,
  },

  // Wallet Card
  walletCardWrap: {
    marginBottom: 32,
  },
  walletCard: {
    padding: 24,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  walletCardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  balanceUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
    fontWeight: '500',
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnTxt: {
    color: palette.brand,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  statementBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statementBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  // History
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },
  filterPillInactive: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  filterPillTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  filterPillTxtActive: {
    color: '#fff',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
    marginRight: 16,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 6,
  },
  historyItemDate: {
    fontSize: 13,
    color: palette.muted,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 15,
    color: palette.muted,
    textAlign: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: palette.muted,
    textAlign: 'center',
    paddingVertical: 32,
  },
});