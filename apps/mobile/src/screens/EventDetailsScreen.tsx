import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const { height: SH } = Dimensions.get('window');

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#F3F4F6';

const EVENT_IMG = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200';

export default function EventDetailsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Header Image ── */}
        <View style={styles.imgWrapper}>
          <ImageBackground source={{ uri: EVENT_IMG }} style={styles.headerImage}>
            <View style={styles.imageOverlay} />
            <SafeAreaView>
              <View style={styles.headerTop}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M19 12H5M12 19l-7-7 7-7"/>
                  </Svg>
                  <Text style={styles.headerTitle}>Event Details</Text>
                </TouchableOpacity>
                <View style={styles.tagPill}>
                  <Text style={styles.tagTxt}>Workshop</Text>
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>

        {/* ── Body Content ── */}
        <View style={styles.bodyContent}>
          <Text style={styles.mainTitle}>UI UX Workshop</Text>

          {/* Details Card */}
          <View style={styles.card}>
            {/* Date & Time */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF0EB' }]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <Line x1="16" y1="2" x2="16" y2="6" />
                  <Line x1="8" y1="2" x2="8" y2="6" />
                  <Line x1="3" y1="10" x2="21" y2="10" />
                </Svg>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLbl}>Date & Time</Text>
                <Text style={styles.infoVal}>17/06/2025 • 03:00 PM</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Venue */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF0EB' }]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                  <Path d="M9 22v-4h6v4"/>
                  <Path d="M9 6h6"/>
                  <Path d="M9 10h6"/>
                  <Path d="M9 14h6"/>
                </Svg>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLbl}>Venue</Text>
                <Text style={styles.infoVal}>IT Park, Auditorium</Text>
                <Text style={styles.infoSub}>Bellandur, Karnataka</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Hosted By */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: BRAND }]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <Circle cx="12" cy="7" r="4" />
                </Svg>
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLbl}>Hosted by</Text>
                <Text style={styles.infoVal}>Santhanam</Text>
                <Text style={styles.infoSub}>UI UX Expert</Text>
              </View>
            </View>
          </View>

          {/* About Card */}
          <View style={styles.card}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutDesc}>
              Join us for a hands-on session exploring creative problem-solving through design thinking. Learn how to empathize with users, define challenges, and prototype innovative solutions in a collaborative environment.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLbl}>Tokens</Text>
          <Text style={styles.footerVal}>100</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => onNavigate('Payment')}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
          <Text style={styles.confirmBtnTxt}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Header Image
  imgWrapper: {
    width: '100%',
    height: SH * 0.35,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  tagPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagTxt: {
    color: BRAND,
    fontSize: 14,
    fontWeight: '700',
  },

  // Body Content
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
    marginBottom: 24,
  },

  // Details Card
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTexts: {
    flex: 1,
  },
  infoLbl: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  infoSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginVertical: 16,
    marginLeft: 60, // align with text
  },

  // About
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  aboutDesc: {
    fontSize: 15,
    color: MUTED,
    lineHeight: 24,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerLbl: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
  footerVal: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B2E',
    paddingHorizontal: 24,
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
