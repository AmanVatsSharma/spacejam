import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Line, Polyline, Circle } from 'react-native-svg';

const BRAND = '#FE7A47';
const BRAND_BG = '#FFF0EB';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';

export default function StatementModal() => void }) {
  const navigation = useNavigation<any>();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <Polyline points="7 10 12 15 17 10"/>
                <Line x1="12" y1="15" x2="12" y2="3"/>
              </Svg>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Download Statement</Text>
              <Text style={styles.headerSubtitle}>Select a date range to export</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>QUICK SELECT</Text>
            <View style={styles.quickSelectGrid}>
              {['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'This year'].map((item, idx) => {
                const isActive = item === 'Last 30 days';
                return (
                  <TouchableOpacity key={idx} style={[styles.pill, isActive && styles.pillActive]}>
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>CUSTOM RANGE</Text>
            
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateBoxWrapper}>
                <Text style={styles.dateLabel}>From</Text>
                <TouchableOpacity style={styles.dateBox}>
                  <Text style={styles.dateValue}>11 May 2026</Text>
                  <View style={styles.dateSubRow}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <Line x1="16" y1="2" x2="16" y2="6"/>
                      <Line x1="8" y1="2" x2="8" y2="6"/>
                      <Line x1="3" y1="10" x2="21" y2="10"/>
                    </Svg>
                    <Text style={styles.dateSubText}>Tap to change</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.arrowContainer}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="5" y1="12" x2="19" y2="12"/>
                  <Polyline points="12 5 19 12 12 19"/>
                </Svg>
              </View>

              <View style={styles.dateBoxWrapper}>
                <Text style={styles.dateLabel}>To</Text>
                <TouchableOpacity style={styles.dateBox}>
                  <Text style={styles.dateValue}>12 Jun 2026</Text>
                  <View style={styles.dateSubRow}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <Line x1="16" y1="2" x2="16" y2="6"/>
                      <Line x1="8" y1="2" x2="8" y2="6"/>
                      <Line x1="3" y1="10" x2="21" y2="10"/>
                    </Svg>
                    <Text style={styles.dateSubText}>Tap to change</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.alertBox}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Polyline points="12 6 12 12 16 14" />
              </Svg>
              <Text style={styles.alertText}>
                Statement from <Text style={{fontWeight: '700'}}>11 May 2026</Text> to <Text style={{fontWeight: '700'}}>12 Jun 2026</Text>
              </Text>
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <Polyline points="7 10 12 15 17 10"/>
                <Line x1="12" y1="15" x2="12" y2="3"/>
              </Svg>
              <Text style={styles.downloadBtnTxt}>Download PDF Statement</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: MUTED,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  pillTextActive: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateBoxWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 8,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  dateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSubText: {
    fontSize: 13,
    color: MUTED,
    marginLeft: 6,
  },
  arrowContainer: {
    paddingHorizontal: 16,
    marginTop: 24, // align with input boxes
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_BG,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  alertText: {
    marginLeft: 10,
    fontSize: 14,
    color: DARK,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  downloadBtn: {
    backgroundColor: BRAND,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});
