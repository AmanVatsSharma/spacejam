/**
 * File:        apps/mobile/src/screens/HomeScreen.tsx
 * Module:      Mobile · Screens · Home
 * Purpose:     Animated, polished home dashboard with staggered card entrances, press feedback, and consistent spacing
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-30
 */
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_HOME_DATA } from '../lib/apollo/operations';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

import { PolishedCard } from '../components/PolishedCard';
import { FloatingNavBar, icons } from '../components/FloatingNavBar';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';

import {
  palette,
  space,
  radius,
  elevation,
  type as typeScale,
  pressScale,
  duration,
} from '../theme/tokens';
import {
  useFadeIn,
  useSlideIn,
  staggerDelay,
  usePressFeedback,
  usePulse,
} from '../theme/animations';

const { width: SW } = Dimensions.get('window');

const HEADER_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
const PROMO_IMAGE = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600';
const SPACE_IMAGE_1 = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&q=80&w=600';
const SPACE_IMAGE_2 = 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&q=80&w=600';

import * as Notifications from 'expo-notifications';
import { useMutation } from '@apollo/client';
import { REGISTER_DEVICE_TOKEN_MUTATION } from '../lib/apollo/operations';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeNav, setActiveNav] = useState<'home' | 'events' | 'bookings' | 'profile'>('home');
  const [showOffer, setShowOffer] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const { data, loading } = useQuery(GET_HOME_DATA);
  const [registerToken] = useMutation(REGISTER_DEVICE_TOKEN_MUTATION);

  React.useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'placeholder-project-id' // Setup Expo project ID later
        });
        registerToken({ variables: { token: tokenData.data } });
      } catch (err) {
        console.log('Failed to get push token:', err);
      }
    })();
  }, [registerToken]);
    setActiveNav(tab);
    const screenMap: Record<string, any> = {
      home: undefined,
      events: 'Events',
      bookings: 'MyBookings',
      profile: 'Profile',
    };
    if (screenMap[tab]) {
      navigation.navigate(screenMap[tab]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header Section ── */}
        <AnimatedHeader 
          name={data?.me?.name || 'Guest'} 
          onShowOffer={() => setShowOffer(true)} 
        />

        {/* ── Stats Cards ── */}
        <StatsRow />

        {/* ── Quick Access ── */}
        <View style={styles.section}>
          <SectionHeader title="QUICK ACCESS" index={2} />
          <View style={styles.quickAccessRow}>
            <QuickAccessItem icon="office" label="Book Space" onPress={() => navigation.navigate('AvailableRooms')} index={0} />
            <QuickAccessItem icon="invoice" label="Invoices" onPress={() => navigation.navigate('MyInvoices')} index={1} />
            <QuickAccessItem icon="print" label="Print" onPress={() => setShowPrintModal(true)} index={2} />
            <QuickAccessItem icon="wallet" label="Wallet" onPress={() => navigation.navigate('Wallet')} index={3} />
          </View>
        </View>

        {/* ── Upcoming ── */}
        <View style={styles.section}>
          <SectionHeader title="UPCOMING" actionLabel="View all" onAction={() => navigation.navigate('MyBookings')} index={3} />
          <PolishedCard elevation="card">
            {data?.myBookings?.slice(0, 2).map((b: any, i: number) => {
              const d = new Date(parseInt(b.date));
              return (
                <React.Fragment key={b.id}>
                  {i > 0 && <View style={styles.itemDivider} />}
                  <UpcomingItem 
                    date={d.getDate().toString()} 
                    month={d.toLocaleString('default', { month: 'short' }).toUpperCase()} 
                    title={`${b.seat?.floor?.name || ''} - ${b.seat?.name || ''}`} 
                    time={`${b.startTime} - ${b.endTime}`} 
                  />
                </React.Fragment>
              );
            }) || <Text style={{ padding: 16, color: '#666' }}>No upcoming bookings</Text>}
          </PolishedCard>
        </View>

        {/* ── Token Balance ── */}
        <TokenCard onPress={() => navigation.navigate('Wallet')} />

        {/* ── Last Paid ── */}
        <View style={styles.section}>
          <SectionHeader title="LAST PAID" actionLabel="View all" onAction={() => navigation.navigate('MyInvoices')} index={5} />
          <PolishedCard elevation="card">
            {data?.invoices?.slice(0, 2).map((inv: any, i: number) => (
              <React.Fragment key={inv.id}>
                {i > 0 && <View style={styles.itemDivider} />}
                <LastPaidItem 
                  icon="door" 
                  title={`Invoice #${inv.id.slice(-4)}`} 
                  sub={`Due: ${new Date(parseInt(inv.dueDate)).toLocaleDateString()}`} 
                  amount={`₹${inv.amount}`} 
                  status={inv.status} 
                  variant={inv.status === 'PAID' ? 'paid' : 'pending'} 
                />
              </React.Fragment>
            )) || <Text style={{ padding: 16, color: '#666' }}>No recent invoices</Text>}
          </PolishedCard>
        </View>

        {/* ── Promo Card ── */}
        <PromoCard />

        {/* ── Our Centers ── */}
        <View style={styles.section}>
          <SectionHeader title="OUR CENTERS" index={7} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {['All', 'Mohali', 'Chandigarh', 'Manali'].map((loc, i) => (
              <CenterPill key={loc} label={loc} active={i === 0} index={i} />
            ))}
          </ScrollView>
        </View>

        {/* ── Nearest Spaces ── */}
        <View style={styles.section}>
          <SectionHeader title="NEAREST SPACES" actionLabel="View all" onAction={() => {}} index={8} />
          <SpaceCard
            img={SPACE_IMAGE_1}
            title="Galaxy Business Park"
            subtitle="Block A - Indiranagar"
            time="8 am - 8 pm"
            dist="2.4 km"
            desks="10 desks available"
            rating="4.4"
            index={0}
          />
          <SpaceCard
            img={SPACE_IMAGE_2}
            title="The Loft Workspace"
            subtitle="Tower B - Sector 62"
            time="8 am - 9 pm"
            dist="3.1 km"
            desks="4 desks available"
            rating="4.7"
            index={1}
          />
        </View>

        {/* ── Referral & Offers ── */}
        <View style={styles.section}>
          <SectionHeader title="REFERRAL AND OFFER" index={10} />
          <View style={styles.refOffersContainer}>
            <RefCard
              title="Earn Credits"
              desc="Get tokens for every referral that books a space"
              accent={palette.brand}
              onPress={() => navigation.navigate('ReferAndEarn')}
              index={0}
            />
            <RefCard
              title="Available Offers"
              desc="Unlock early booking deals and credit discounts"
              accent="#6BD0C4"
              onPress={() => navigation.navigate('Offers')}
              index={1}
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating Nav Bar ── */}
      <FloatingNavBar activeTab={activeNav} onTabChange={handleNavChange} />

      {/* ── Modals ── */}
      {showOffer && <CustomOfferModalWrapper visible={showOffer} onClose={() => setShowOffer(false)} />}
      {showPrintModal && (
        <PrintUploadModalWrapper
          visible={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onUploadComplete={() => {
            setShowPrintModal(false);
            navigation.navigate('PrintPreview');
          }}
        />
      )}
    </View>
  );
}

// ─── Animated Header ──────────────────────────────────────────────────────────

const AnimatedHeader = ({ name, onShowOffer }: { name: string, onShowOffer: () => void }) => {
  const headerFade = useFadeIn(0, { fromY: 0, durationOverride: duration.hero });
  const { opacity: overlayOp } = useFadeIn(200, { fromY: 0 });
  const offerFade = useFadeIn(300, { fromY: 16, durationOverride: duration.slow });
  const { opacity: labelOp } = useFadeIn(100, { fromY: 0 });
  const pulse = usePulse({ minScale: 0.8, maxScale: 1.1, duration: 2000 });

  return (
    <Animated.View style={[styles.headerBg, headerFade]}>
      <Animated.View style={[styles.headerOverlay, { opacity: overlayOp }]} />

      <View style={styles.safeArea}>
        {/* Top bar */}
        <View style={styles.headerTop}>
          <View>
            <Animated.Text style={[styles.greeting, labelOp]}>GOOD MORNING</Animated.Text>
            <Animated.Text style={[styles.userName, labelOp]}>{name.split(' ')[0]}</Animated.Text>
          </View>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.bellBtn, { transform: [{ scale: pulse.scale }] }]}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
              <View style={styles.bellDot} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>

        {/* Bottom Offer */}
        <Animated.View style={[styles.offerSection, offerFade]}>
          <Animated.Text style={[styles.offerLabel, labelOp]}>LIMITED OFFER</Animated.Text>
          <View style={styles.offerRow}>
            <Animated.Text style={styles.offerPercent}>30% </Animated.Text>
            <Animated.Text style={styles.offerOff}>off</Animated.Text>
          </View>
          <View style={styles.offerBottomRow}>
            <Animated.Text style={[styles.offerDesc, labelOp]}>On your next space booking</Animated.Text>
            <TouchableWithoutFeedback onPress={onShowOffer}>
              <Animated.View style={styles.claimBtn}>
                <Animated.Text style={styles.claimText}>Claim Offer </Animated.Text>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="5" y1="12" x2="19" y2="12" />
                  <Polyline points="12 5 19 12 12 19" />
                </Svg>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ─── Stats Row ────────────────────────────────────────────────────────────────

const StatsRow = () => {
  const rowFade = useSlideIn('left', 200, 30, duration.slow);
  const { opacity: card1Op } = useFadeIn(staggerDelay(0, 250, 80), { fromY: 12 });
  const { opacity: card2Op } = useFadeIn(staggerDelay(1, 250, 80), { fromY: 12 });
  const { opacity: card3Op } = useFadeIn(staggerDelay(2, 250, 80), { fromY: 12 });

  return (
    <Animated.View style={[styles.statsContainer, rowFade]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
        <Animated.View style={{ opacity: card1Op }}>
          <PolishedCard elevation="subtle" borderRadius={radius.md}>
            <Text style={styles.statLabel}>UPCOMING</Text>
            <Text style={styles.statValue}>₹8,463</Text>
            <Text style={styles.statSub}>Due 10 May</Text>
          </PolishedCard>
        </Animated.View>
        <Animated.View style={{ opacity: card2Op }}>
          <PolishedCard elevation="subtle" borderRadius={radius.md}>
            <Text style={styles.statLabel}>LAST PAID</Text>
            <Text style={styles.statValue}>₹2,463</Text>
            <Text style={styles.statSub}>Paid Jan 2026</Text>
          </PolishedCard>
        </Animated.View>
        <Animated.View style={{ opacity: card3Op }}>
          <PolishedCard elevation="subtle" borderRadius={radius.md}>
            <Text style={styles.statLabel}>TOKENS</Text>
            <Text style={styles.statValue}>2500</Text>
            <Text style={styles.statSub}>+10 6/26</Text>
          </PolishedCard>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

// ─── Quick Access Item ────────────────────────────────────────────────────────

const QuickAccessItem = ({ icon, label, onPress, index }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.94, speed: 100 });
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 350, 60), { fromY: 12 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: 'center', width: '25%' }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.94 : 1 }], alignItems: 'center' }}>
          <View style={styles.quickIconBox}>
            {icon === 'office' && icons.home({ color: palette.ink, strokeWidth: 1.5 })}
            {icon === 'invoice' && (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Polyline points="14 2 14 8 20 8" />
                <Line x1="16" y1="13" x2="8" y2="13" />
                <Line x1="16" y1="17" x2="8" y2="17" />
                <Polyline points="10 9 9 9 8 9" />
              </Svg>
            )}
            {icon === 'print' && (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="1.5">
                <Path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <Rect x="6" y="14" width="12" height="8" />
              </Svg>
            )}
            {icon === 'wallet' && (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </Svg>
            )}
          </View>
          <Text style={styles.quickIconLabel}>{label}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Upcoming Item ────────────────────────────────────────────────────────────

const UpcomingItem = ({ date, month, title, time }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 80 });

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <View style={styles.upcomingItem}>
        <View style={styles.upcomingDateBox}>
          <Text style={styles.upcDate}>{date}</Text>
          <Text style={styles.upcMonth}>{month}</Text>
        </View>
        <View style={styles.upcomingContent}>
          <Text style={styles.upcTitle}>{title}</Text>
          <View style={styles.upcTimeRow}>
            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M12 6v6l4 2" />
            </Svg>
            <Text style={styles.upcTime}>{time}</Text>
          </View>
        </View>
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.border} strokeWidth="2">
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      </View>
    </TouchableWithoutFeedback>
  );
};

// ─── Last Paid Item ───────────────────────────────────────────────────────────

const LastPaidItem = ({ icon, title, sub, amount, status, variant }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 80 });

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <View style={styles.upcomingItem}>
        <View style={styles.lpIconBox}>
          {icon === 'door' && (
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="1.5">
              <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <Path d="M9 22v-4h6v4" />
            </Svg>
          )}
          {icon === 'desk' && (
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.brand} strokeWidth="1.5">
              <Rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
              <Path d="M6 17v4M18 17v4M6 7V3M18 7V3" />
            </Svg>
          )}
        </View>
        <View style={[styles.upcomingContent, { marginLeft: 12 }]}>
          <Text style={styles.upcTitle}>{title}</Text>
          <Text style={styles.upcTime}>{sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.lpAmount}>{amount}</Text>
          <StatusPill label={status} variant={variant as any} size="sm" />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

// ─── Token Balance Card ───────────────────────────────────────────────────────

const TokenCard = ({ onPress }: { onPress: () => void }) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(4, 300, 80), { fromY: 12 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.98, speed: 100 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginHorizontal: space.lg, marginBottom: space['2xl'] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.98 : 1 }] }}>
          <PolishedCard elevation="raised" borderRadius={radius.xl} style={{ backgroundColor: '#2A2D32' }}>
            <View style={styles.tokenCardInner}>
              <View>
                <Text style={styles.tokenLabel}>TOKEN BALANCE</Text>
                <View style={styles.tokenValRow}>
                  <Text style={styles.tokenVal}>2,500</Text>
                  <Text style={styles.tokenUnit}>tokens</Text>
                </View>
              </View>
              <View style={styles.topUpBtn}>
                <Text style={styles.topUpText}>Top up</Text>
              </View>
            </View>
          </PolishedCard>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Promo Card ───────────────────────────────────────────────────────────────

const PromoCard = () => {
  const { opacity, translateY } = useFadeIn(staggerDelay(6, 400, 80), { fromY: 16 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], paddingHorizontal: space.lg, marginBottom: space['2xl'] }}>
      <PolishedCard elevation="card" borderRadius={radius.xl} padding={0} style={{ overflow: 'hidden' }}>
        <ImageBackground source={{ uri: PROMO_IMAGE }} style={styles.promoCard} imageStyle={{ borderRadius: radius.xl }}>
          <View style={styles.promoOverlay} />
          <View style={styles.promoContent}>
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>✦ NEW OPEN</Text>
            </View>
            <Text style={styles.promoTitle}>Galaxy Business Park</Text>
            <View style={styles.promoBottom}>
              <View style={styles.promoLocIcon}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <Circle cx="12" cy="10" r="3" />
                </Svg>
              </View>
              <View style={styles.promoLocTexts}>
                <Text style={styles.promoLocName}>Block A, Indiranagar</Text>
                <Text style={styles.promoLocSub}>2.4 km away • ★ 4.4</Text>
              </View>
              <TouchableWithoutFeedback>
                <View style={styles.promoArrow}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <Path d="M5 12h14M12 5l7 7-7 7" />
                  </Svg>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </ImageBackground>
      </PolishedCard>
    </Animated.View>
  );
};

// ─── Center Pill ──────────────────────────────────────────────────────────────

const CenterPill = ({ label, active, index }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.96, speed: 100 });
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 600, 50), { fromY: 8 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.96 : 1 }] }}>
          <View style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
            <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>{label}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Space Card ───────────────────────────────────────────────────────────────

const SpaceCard = ({ img, title, subtitle, time, dist, desks, rating, index }: any) => {
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 700, 100), { fromY: 16 });
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.985, speed: 100 });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: 16 }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
        <PolishedCard elevation="raised" borderRadius={radius.lg}>
          <View style={styles.spaceImgWrapper}>
            <Image source={{ uri: img }} style={styles.spaceImg} />
            <View style={styles.spaceRating}>
              <Text style={styles.spaceRatingTxt}>★ {rating}</Text>
            </View>
            <View style={styles.spaceImgOverlay}>
              <Text style={styles.spaceCardTitle}>{title}</Text>
              <Text style={styles.spaceCardSub}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.spaceCardFooter}>
            <View style={styles.spaceFtrItem}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.spaceFtrTxt}>{time}</Text>
            </View>
            <View style={styles.spaceFtrItem}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth="2">
                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <Circle cx="12" cy="10" r="3" />
              </Svg>
              <Text style={styles.spaceFtrTxt}>{dist}</Text>
            </View>
            <View style={styles.spaceFtrItem}>
              <Text style={[styles.spaceFtrTxt, { color: palette.ink }]}>{desks}</Text>
            </View>
          </View>
        </PolishedCard>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Referral Card ────────────────────────────────────────────────────────────

const RefCard = ({ title, desc, accent, onPress, index }: any) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.97, speed: 100 });
  const { opacity, translateY } = useFadeIn(staggerDelay(index, 800, 60), { fromY: 12 });

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: pressIn ? 0.97 : 1 }] }}>
          <PolishedCard elevation="subtle" borderRadius={radius.md} style={{ borderTopWidth: 3, borderTopColor: accent }}>
            <Text style={styles.refCardTitle}>{title}</Text>
            <Text style={styles.refCardDesc}>{desc}</Text>
          </PolishedCard>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Modal stubs (re-export existing modals) ───────────────────────────────────
const CustomOfferModalWrapper = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { scale, opacity } = useSpringEntrance();
  return (
    <Animated.View style={{ flex: 1, position: 'absolute', inset: 0, zIndex: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', opacity }}>
      <Animated.View style={{ transform: [{ scale }], backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: palette.ink }}>Limited Offer</Text>
        <Text style={{ fontSize: 14, color: palette.muted, marginBottom: 20 }}>30% off on your next space booking!</Text>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={{ backgroundColor: palette.brand, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Claim Now</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  );
};

const PrintUploadModalWrapper = ({ visible, onClose, onUploadComplete }: any) => {
  const { scale, opacity } = useSpringEntrance();
  return (
    <Animated.View style={{ flex: 1, position: 'absolute', inset: 0, zIndex: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', opacity }}>
      <Animated.View style={{ transform: [{ scale }], backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: palette.ink }}>Upload Document</Text>
        <Text style={{ fontSize: 14, color: palette.muted, marginBottom: 20 }}>Select a file to print</Text>
        <TouchableWithoutFeedback onPress={onUploadComplete}>
          <Animated.View style={{ backgroundColor: palette.brand, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Upload & Print</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Header
  headerBg: {
    width: '100%',
    height: 310,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    marginTop: 10,
  },
  greeting: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.brand,
  },
  offerSection: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: space.xl,
  },
  offerLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  offerPercent: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  offerOff: {
    color: '#FFD166',
    fontSize: 24,
    fontWeight: '700',
  },
  offerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  offerDesc: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -20,
    right: 20,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 12,
    backgroundColor: palette.brand,
  },

  // Stats
  statsContainer: {
    marginTop: -25,
    paddingLeft: space.lg,
    marginBottom: 16,
  },
  statsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  statLabel: {
    fontSize: 10,
    color: palette.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    color: palette.muted,
  },

  // Quick Access
  section: {
    marginBottom: 24,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickIconBox: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.sm,
    ...elevation.subtle,
  },
  quickIconLabel: {
    fontSize: 12,
    color: palette.inkSub,
    fontWeight: '600',
  },

  // Lists
  itemDivider: {
    height: 1,
    backgroundColor: palette.borderSoft,
    marginVertical: 16,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  upcomingDateBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.brandWash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcDate: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.brand,
  },
  upcMonth: {
    fontSize: 10,
    color: palette.brand,
    fontWeight: '600',
  },
  upcomingContent: {
    flex: 1,
    marginLeft: space.md,
  },
  upcTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
    marginBottom: 4,
  },
  upcTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcTime: {
    fontSize: 12,
    color: palette.muted,
  },
  // Last Paid
  lpIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSub,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lpAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 4,
  },

  // Token
  tokenCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 6,
  },
  tokenValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tokenVal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  tokenUnit: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  topUpBtn: {
    backgroundColor: palette.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  topUpText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  // Promo
  promoWrapper: {
    paddingHorizontal: space.lg,
    marginBottom: 24,
  },
  promoCard: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.xl,
  },
  promoContent: {
    padding: 16,
  },
  newTag: {
    backgroundColor: palette.brand,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginBottom: 8,
  },
  newTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  promoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoLocIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoLocTexts: {
    flex: 1,
  },
  promoLocName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  promoLocSub: {
    color: '#E2E8F0',
    fontSize: 10,
  },
  promoArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pills
  pillsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: palette.brand,
  },
  pillInactive: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  pillTextInactive: {
    color: palette.muted,
  },

  // Space Cards
  spaceCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...elevation.raised,
  },
  spaceImgWrapper: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  spaceImg: {
    width: '100%',
    height: '100%',
  },
  spaceRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  spaceRatingTxt: {
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '700',
  },
  spaceImgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  spaceCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  spaceCardSub: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  spaceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  spaceFtrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spaceFtrTxt: {
    fontSize: 11,
    color: palette.muted,
    fontWeight: '500',
  },

  // Ref & Offers
  refOffersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  refCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 6,
  },
  refCardDesc: {
    fontSize: 11,
    color: palette.muted,
    lineHeight: 16,
  },
});