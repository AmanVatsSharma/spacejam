import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import {
  GET_MY_REFERRAL_STATS,
  GET_MY_REFERRALS,
} from '../lib/apollo/operations';

const { width: SW } = Dimensions.get('window');

const BRAND = '#FE7A47';
const BG = '#F7F9FC';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';

export default function ReferAndEarnScreen() {
  const navigation = useNavigation<any>();
  const [copied, setCopied] = useState(false);

  const { data: statsData, loading: statsLoading } = useQuery(GET_MY_REFERRAL_STATS);
  const { data: referralsData, loading: referralsLoading } = useQuery(GET_MY_REFERRALS);

  const stats = statsData?.myReferralStats;
  const referrals = referralsData?.myReferrals || [];

  const successfulCount = stats?.successful ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;
  const referralCode = stats?.referralCode || '';

  const handleShare = async () => {
    if (!referralCode) return;
    const message = `Join me on SpaceJam! Use my referral code ${referralCode} to get bonus credits when you sign up.`;
    try {
      const result = await Share.share({ message });
      if (result.action === Share.sharedAction) {
        setCopied(true);
        Toast.show({ type: 'success', text1: 'Shared!', text2: 'Thanks for spreading the word.' });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      // User dismissed the share sheet or share failed — don't surface a scary error.
      if (err?.message !== 'User did not share') {
        Alert.alert('Unable to share', err?.message || 'Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={[styles.decoCircle, { top: -20, right: -20, width: 120, height: 120, opacity: 0.1 }]} />
          <View style={[styles.decoCircle, { bottom: -30, left: -20, width: 100, height: 100, opacity: 0.1 }]} />

          <View style={styles.heroIconWrapper}>
            <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></Path>
              <Circle cx="9" cy="7" r="4"></Circle>
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87"></Path>
              <Path d="M16 3.13a4 4 0 0 1 0 7.75"></Path>
            </Svg>
          </View>

          <Text style={styles.heroTitle}>Earn ₹100 Per Friend</Text>
          <Text style={styles.heroSub}>
            Share your code and earn bonus credits{'\n'}for every successful referral
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF0EB' }]}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE7A47" strokeWidth="2">
                <Circle cx="12" cy="8" r="5" />
                <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" />
              </Svg>
            </View>
            <Text style={[styles.statVal, { color: '#FE7A47' }]}>
              {statsLoading ? '...' : successfulCount}
            </Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#E6F9F5' }]}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#20C997" strokeWidth="2">
                <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <Polyline points="16 7 22 7 22 13" />
              </Svg>
            </View>
            <Text style={[styles.statVal, { color: '#20C997' }]}>
              {statsLoading ? '...' : `₹${totalEarned}`}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF9E6' }]}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>
              {statsLoading ? '...' : (stats?.pending ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Referral Code */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2">
              <Path d="M12 2v20M2 12h20M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" />
            </Svg>
            <Text style={styles.codeTitle}>Your Referral Code</Text>
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{statsLoading ? '...' : (referralCode || '------')}</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2">
                <Circle cx="18" cy="5" r="3"/>
                <Circle cx="6" cy="12" r="3"/>
                <Circle cx="18" cy="19" r="3"/>
                <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </Svg>
              <Text style={styles.shareBtnTxt}>{copied ? 'Copied!' : 'Share Code'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.hiwCard}>
          <View style={styles.hiwHeader}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2">
              <Path d="M20 12v10H4V12"/>
              <Path d="M2 7h20v5H2z"/>
              <Line x1="12" y1="22" x2="12" y2="7"/>
              <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </Svg>
            <Text style={styles.hiwTitle}>How It Works</Text>
          </View>

          <View style={styles.stepsList}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconBox, { backgroundColor: BRAND }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTag}><Text style={styles.stepTagTxt}>Step 1</Text></View>
                <Text style={styles.stepText}>Share your referral code</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconBox, { backgroundColor: '#20C997' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></Path><Circle cx="9" cy="7" r="4"></Circle><Path d="M23 21v-2a4 4 0 0 0-3-3.87"></Path><Path d="M16 3.13a4 4 0 0 1 0 7.75"></Path>
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTag}><Text style={styles.stepTagTxt}>Step 2</Text></View>
                <Text style={styles.stepText}>Friend signs up with your code</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconBox, { backgroundColor: '#F59E0B' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <Path d="M20 6L9 17l-5-5"/>
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTag}><Text style={styles.stepTagTxt}>Step 3</Text></View>
                <Text style={styles.stepText}>They complete their first booking</Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconBox, { backgroundColor: '#9F7AEA' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <Circle cx="12" cy="8" r="5" />
                  <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" />
                </Svg>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTag}><Text style={styles.stepTagTxt}>Step 4</Text></View>
                <Text style={styles.stepText}>You both get ₹100 credits</Text>
              </View>
            </View>
          </View>
        </View>

        {/* My Referrals List */}
        <Text style={styles.listTitle}>Your Referrals</Text>
        {referralsLoading ? (
          <Text style={styles.loadingText}>Loading referrals...</Text>
        ) : referrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No referrals yet. Share your code to get started!</Text>
          </View>
        ) : (
          <View style={styles.referralList}>
            {referrals.map((r: any) => (
              <View key={r.id} style={styles.referralItem}>
                <View style={styles.referralLeft}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <Circle cx="12" cy="7" r="4" />
                  </Svg>
                  <View>
                    <Text style={styles.referralEmail}>{r.referredEmail}</Text>
                    <Text style={styles.referralDate}>
                      {new Date(r.createdAt).toLocaleDateString()} · {r.status}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.referralReward,
                  { color: r.status === 'rewarded' ? '#20C997' : MUTED }
                ]}>
                  {r.status === 'rewarded' ? `+₹${r.rewardAmount || 100}` : 'Pending'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Terms */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteTxt}>
            * Credits will be added within 24 hours of successful referral. Terms and conditions apply.
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Hero
  heroCard: {
    backgroundColor: '#FE8556',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 100,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '31%',
    alignItems: 'center',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },

  // Referral Code
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD9CC',
    padding: 20,
    marginBottom: 24,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareBtnTxt: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '600',
  },

  // How It Works
  hiwCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  hiwHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  hiwTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTag: {
    backgroundColor: '#FFF0EB',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  stepTagTxt: {
    color: BRAND,
    fontSize: 10,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: DARK,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Referrals List
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  referralList: {
    gap: 12,
    marginBottom: 24,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  referralLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  referralEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  referralDate: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  referralReward: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Footer Note
  footerNote: {
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    padding: 16,
  },
  footerNoteTxt: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 18,
  },
});
