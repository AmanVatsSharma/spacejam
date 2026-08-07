import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const { height: SH } = Dimensions.get('window');

const BRAND = '#FE7A47';
const TEAL = '#48C9B0';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BG = '#fff';

const BG_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';

export default function QuickBookingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Header Image ── */}
        <ImageBackground source={{ uri: BG_IMAGE }} style={styles.headerImage}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M19 12H5M12 19l-7-7 7-7"/>
                </Svg>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Book Meeting Room</Text>
            </View>
          </SafeAreaView>
          <View style={styles.imageOverlay} />
        </ImageBackground>

        {/* ── Floating Info Card ── */}
        <View style={styles.infoCardWrapper}>
          <View style={styles.infoCard}>
            <Text style={styles.roomName}>MR-201 (8 Seater)</Text>
            <View style={styles.roomSubRow}>
              <View>
                <Text style={styles.roomFloor}>1st Floor</Text>
                <Text style={styles.roomLoc}>X11 Space, Mohali</Text>
              </View>
              <View style={styles.amenities}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <Line x1="12" y1="20" x2="12.01" y2="20" />
                </Svg>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
                  <Path d="M6 17v4M18 17v4M6 7V3M18 7V3"/>
                </Svg>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <Line x1="8" y1="21" x2="16" y2="21" />
                  <Line x1="12" y1="17" x2="12" y2="21" />
                </Svg>
              </View>
            </View>
          </View>
        </View>

        {/* ── Details Sections ── */}
        <View style={styles.bodyContent}>
          
          {/* Booking Details */}
          <Text style={styles.sectionTitle}>Your booking details</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTxtBold}>Fri, 15 May • 12:30 pm - 0.5 hours</Text>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: TEAL }]}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Community */}
          <Text style={styles.sectionTitle}>Community</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#F0FBF9' }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <Circle cx="12" cy="7" r="4" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.cardSub}>Community member</Text>
                  <Text style={styles.cardTitle}>Aditya Wariyal</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: TEAL }]}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.cardFooterTxt}>Reach out to the community team for any support</Text>
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FFF0EB' }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Get directions</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>A-44 & 45, Sushil Marg, Block A, In.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.circleArrowBtn}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="5" y1="12" x2="19" y2="12" />
                  <Polyline points="12 5 19 12 12 19" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom Fixed Footer ── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerCostLbl}>Total Cost</Text>
          <Text style={styles.footerCostVal}>₹590</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn}>
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
    paddingBottom: 40,
  },
  
  // Header Image
  headerImage: {
    width: '100%',
    height: SH * 0.35,
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  // Floating Info Card
  infoCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -50, // Pull it up over the image
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  roomSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  roomFloor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  roomLoc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  amenities: {
    flexDirection: 'row',
    gap: 12,
  },

  // Body Content
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 16,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  cardTxtBold: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  cardSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  
  // Icon Buttons
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginVertical: 16,
  },
  cardFooterTxt: {
    fontSize: 13,
    color: '#9CA3AF',
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
    borderTopColor: '#F3F4F6',
  },
  footerCostLbl: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
  footerCostVal: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B2E',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    gap: 8,
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
