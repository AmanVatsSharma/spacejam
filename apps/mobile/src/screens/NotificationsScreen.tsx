import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Rect, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const BG = '#F7F9FC';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={[styles.filterTxt, styles.filterTxtActive]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterTxt}>Unread</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>3</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterTxt}>Bookings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterTxt}>Offers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterTxt}>System</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>TODAY</Text>
        
        {/* Card 1 */}
        <NotificationCard 
          icon={
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE7A47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <Line x1="16" y1="2" x2="16" y2="6"/>
              <Line x1="8" y1="2" x2="8" y2="6"/>
              <Line x1="3" y1="10" x2="21" y2="10"/>
            </Svg>
          }
          iconBg="#FFF0EB"
          title="Booking Confirmed"
          tag="Meeting Room"
          tagColor="#FE7A47"
          tagBg="#FFF0EB"
          unread={true}
          body="Ocean View – MR-201 is confirmed for May 5, 2026 at 10:00 AM. Access code: 7rd88."
          time="Just now"
        />

        {/* Card 2 */}
        <NotificationCard 
          icon={
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#20C997" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <Polyline points="22 4 12 14.01 9 11.01"/>
            </Svg>
          }
          iconBg="#E6F9F5"
          title="Payment Successful"
          tag="Payment"
          tagColor="#20C997"
          tagBg="#E6F9F5"
          unread={true}
          body="₹270 deducted for your booking. Invoice #INV-0004 is available in My Receipts."
          time="5 min ago"
        />

        {/* Card 3 */}
        <NotificationCard 
          icon={
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <Line x1="7" y1="7" x2="7.01" y2="7"/>
            </Svg>
          }
          iconBg="#FFF9E6"
          title="Exclusive Offer 🎉"
          tag="Coupon"
          tagColor="#F59E0B"
          tagBg="#FFF9E6"
          unread={true}
          body="Use code SJ2026 for ₹100 off on your next booking. Valid till May 31, 2026."
          time="1 hr ago"
        />

        {/* Card 4 */}
        <NotificationCard 
          icon={
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9F7AEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </Svg>
          }
          iconBg="#F3EBFF"
          title="AI Workshop Tomorrow"
          tag="Event"
          tagColor="#9F7AEA"
          tagBg="#F3EBFF"
          unread={false}
          body="Don't forget — AI Workshop at Conference Hall starts at 3:00 PM tomorrow. Seats are filling fast."
          time="3 hrs ago"
        />

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>YESTERDAY</Text>
        
        {/* Card 5 */}
        <NotificationCard 
          icon={
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE7A47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <Line x1="16" y1="2" x2="16" y2="6"/>
              <Line x1="8" y1="2" x2="8" y2="6"/>
              <Line x1="3" y1="10" x2="21" y2="10"/>
            </Svg>
          }
          iconBg="#FFF0EB"
          title="Upcoming Booking Reminder"
          tag="Reminder"
          tagColor="#FE7A47"
          tagBg="#FFF0EB"
          unread={false}
          body="Your meeting room booking for Meeting Room B is in 2 hours. Jan 17, 2026 @ 02:00 PM."
          time="Yesterday"
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

const NotificationCard = ({ icon, iconBg, title, tag, tagColor, tagBg, unread, body, time }: any) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {tag && (
              <View style={[styles.tagPill, { backgroundColor: tagBg }]}>
                <Text style={[styles.tagTxt, { color: tagColor }]}>{tag}</Text>
              </View>
            )}
            {unread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </View>
      <View style={styles.cardBodyContainer}>
        <Text style={styles.bodyTxt}>{body}</Text>
        <View style={styles.timeRow}>
          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A0AAB4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Polyline points="12 6 12 12 16 14" />
          </Svg>
          <Text style={styles.timeTxt}>{time}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  
  // Filters
  filtersWrapper: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  filterPillActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  filterTxt: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  filterTxtActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: BRAND,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginRight: 8,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 'auto',
  },
  tagTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginLeft: 8,
    marginTop: 2,
  },
  cardBodyContainer: {
    paddingLeft: 52, // 40 (icon width) + 12 (margin)
  },
  bodyTxt: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeTxt: {
    fontSize: 11,
    color: '#A0AAB4',
    fontWeight: '500',
  },
});
