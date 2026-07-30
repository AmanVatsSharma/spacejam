import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Rect } from 'react-native-svg';

const BRAND = '#FE7A47';
const BG = '#F7F9FC';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';

export default function OffersScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Decorative shapes */}
          <View style={[styles.decoCircle, { top: -20, right: -20, width: 120, height: 120, opacity: 0.1 }]} />
          <View style={[styles.decoCircle, { bottom: -30, left: -20, width: 100, height: 100, opacity: 0.1 }]} />
          
          <View style={styles.heroIconWrapper}>
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" />
            </Svg>
          </View>
          
          <Text style={styles.heroTitle}>4 Available Offers</Text>
          
          <View style={styles.heroPill}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <Polyline points="16 7 22 7 22 13" />
            </Svg>
            <Text style={styles.heroPillTxt}>Save up to ₹2000 total</Text>
          </View>
        </View>

        {/* ── Offer Cards ── */}
        
        {/* Card 1: Orange */}
        <OfferCard 
          color="#FF7F50" 
          tag1="New User" 
          tag2="3 days" 
          tag3="50% OFF" 
          title="First Booking Bonus" 
          subtitle="Get 50% off on your first booking" 
          code="FIRST50" 
        />

        {/* Card 2: Teal */}
        <OfferCard 
          color="#48C9B0" 
          tag1="Printing" 
          tag2="7 days" 
          tag3="100 Credits" 
          title="Print Credits Pack" 
          subtitle="Get 100 free Print Credits on Signup" 
          code="PRINT100" 
        />

        {/* Card 3: Yellow */}
        <OfferCard 
          color="#F4D03F" 
          tag1="Rooms" 
          tag2="5 days" 
          tag3="20% OFF" 
          title="Meeting Room Deal" 
          subtitle="20% off on all meeting room bookings" 
          code="MEET20" 
        />

        {/* Card 4: Blue */}
        <OfferCard 
          color="#5D9CEC" 
          tag1="Membership" 
          tag2="10 days" 
          tag3="₹500 OFF" 
          title="Monthly Pass Pro" 
          subtitle="Save ₹500 on monthly workspace pass" 
          code="MONTHLY500" 
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

const OfferCard = ({ color, tag1, tag2, tag3, title, subtitle, code }: any) => {
  return (
    <View style={styles.offerCard}>
      {/* Top Half (Colored Background) */}
      <View style={[styles.offerTop, { backgroundColor: color }]}>
        {/* Decorative subtle circles in background */}
        <View style={[styles.decoCircle, { top: -20, right: 20, width: 80, height: 80, opacity: 0.1 }]} />
        <View style={[styles.decoCircle, { bottom: -20, left: -10, width: 60, height: 60, opacity: 0.1 }]} />
        
        <View style={styles.tagsRow}>
          <View style={styles.tagGroup}>
            <View style={styles.tagPill}>
              <Text style={styles.tagTxt}>{tag1}</Text>
            </View>
            <View style={styles.tagPill}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ marginRight: 4 }}>
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.tagTxt}>{tag2}</Text>
            </View>
          </View>
          
          <View style={styles.tagPillDark}>
            <Text style={styles.tagTxtDark}>{tag3}</Text>
          </View>
        </View>

        <Text style={styles.offerTitle}>{title}</Text>
        <Text style={styles.offerSub}>{subtitle}</Text>
      </View>

      {/* Bottom Half (White Background) */}
      <View style={styles.offerBottom}>
        <View>
          <Text style={styles.codeLabel}>Promo Code</Text>
          <Text style={styles.codeText}>{code}</Text>
        </View>
        <TouchableOpacity style={styles.copyBtn}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2">
            <Rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </Svg>
          <Text style={styles.copyBtnTxt}>Copy Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroPillTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Offer Cards
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  offerTop: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tagPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagTxtDark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  offerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  offerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  offerBottom: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copyBtnTxt: {
    color: BRAND,
    fontSize: 12,
    fontWeight: '700',
  },
});
