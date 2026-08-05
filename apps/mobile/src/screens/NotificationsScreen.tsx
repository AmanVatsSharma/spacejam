import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS, MARK_NOTIFICATION_READ } from '../lib/apollo/operations';
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

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const { data, loading } = useQuery(GET_NOTIFICATIONS);
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);

  const notifications = data?.myNotifications || [];

  const handleRead = (id: string) => {
    markRead({ variables: { id } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
        {loading ? (
          <Text style={{ textAlign: 'center', padding: 20 }}>Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20 }}>No notifications</Text>
        ) : (
          notifications.map((notif: any) => (
             <TouchableOpacity key={notif.id} onPress={() => handleRead(notif.id)}>
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
                 title={notif.title}
                 tag={notif.type}
                 tagColor="#FE7A47"
                 tagBg="#FFF0EB"
                 unread={!notif.read}
                 body={notif.body}
                 time={new Date(parseInt(notif.createdAt)).toLocaleDateString()}
               />
             </TouchableOpacity>
          ))
        )}

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
