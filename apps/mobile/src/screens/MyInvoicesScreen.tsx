import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';
import InvoicePreviewModal from './InvoicePreviewModal';
import BookingAgreementModal from './BookingAgreementModal';

const BRAND = '#FE7A47';
const BRAND_BG = '#FFF0EB';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

const INVOICE_DATA: any = {
  'Meeting Rooms': {
    total: '1700',
    typeLbl: 'Meeting Rooms',
    count: '5',
    items: [
      { id: '1', title: 'Meeting Room A', date: 'Jan 18, 2026 @ 10:00 AM', amount: '₹300' },
      { id: '2', title: 'Meeting Room B', date: 'Jan 17, 2026 @ 02:00 PM', amount: '₹250' },
      { id: '3', title: 'Conference Hall', date: 'Jan 15, 2026 @ 11:00 AM', amount: '₹500' },
      { id: '4', title: 'Meeting Room A', date: 'Jan 14, 2026 @ 09:00 AM', amount: '₹300' },
      { id: '5', title: 'Meeting Room C', date: 'Jan 12, 2026 @ 03:00 PM', amount: '₹350' },
    ]
  },
  'Events': {
    total: '700',
    typeLbl: 'Events',
    count: '5',
    items: [
      { id: '1', title: 'AI Workshop', date: 'Jan 18, 2026 @ 10:00 AM', amount: '₹100' },
      { id: '2', title: 'Networking Event', date: 'Jan 16, 2026 @ 06:00 PM', amount: '₹150' },
      { id: '3', title: 'Product Launch', date: 'Jan 14, 2026 @ 03:00 PM', amount: '₹200' },
      { id: '4', title: 'Tech Meetup', date: 'Jan 12, 2026 @ 05:00 PM', amount: '₹100' },
      { id: '5', title: 'Design Sprint', date: 'Jan 10, 2026 @ 10:00 AM', amount: '₹150' },
    ]
  },
  'Print Requests': {
    total: '400',
    typeLbl: 'Print Jobs',
    count: '5',
    items: [
      { id: '1', title: '50 pages print', date: 'Jan 18, 2026 @ 10:00 AM', amount: '₹75' },
      { id: '2', title: '100 pages print', date: 'Jan 17, 2026 @ 09:00 AM', amount: '₹50' },
      { id: '3', title: '25 pages print', date: 'Jan 16, 2026 @ 04:00 PM', amount: '₹40' },
      { id: '4', title: '200 pages print', date: 'Jan 15, 2026 @ 11:00 AM', amount: '₹150' },
      { id: '5', title: '75 pages print', date: 'Jan 14, 2026 @ 02:00 PM', amount: '₹85' },
    ]
  },
  'Recharges': {
    total: '1550',
    typeLbl: 'Recharges',
    count: '5',
    items: [
      { id: '1', title: '500 Tokens Buy', date: 'Jan 18, 2026 @ 10:00 AM', amount: '₹300' },
      { id: '2', title: '1000 Tokens Buy', date: 'Jan 17, 2026 @ 02:00 PM', amount: '₹500' },
      { id: '3', title: '200 Tokens Buy', date: 'Jan 15, 2026 @ 11:00 AM', amount: '₹150' },
      { id: '4', title: '750 Tokens Buy', date: 'Jan 14, 2026 @ 09:00 AM', amount: '₹400' },
    ]
  }
};

export default function MyInvoicesScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Meeting Rooms');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const TABS = ['Meeting Rooms', 'Events', 'Print Requests', 'Recharges'];

  const openInvoice = (item: any) => {
    setSelectedInvoice(item);
    setShowInvoiceModal(true);
  };

  const openAgreement = (item: any) => {
    setSelectedInvoice(item);
    setShowAgreementModal(true);
  };

  const currentData = INVOICE_DATA[activeTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="19" y1="12" x2="5" y2="12" />
            <Polyline points="12 19 5 12 12 5" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Invoices</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLbl}>Total Spent</Text>
            <Text style={styles.summaryVal}>₹{currentData.total}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryRightLbl}>{currentData.typeLbl}</Text>
            <Text style={styles.summaryRightVal}>{currentData.count} receipts</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabTxt, isActive && styles.tabTxtActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {currentData.items.map((item: any, index: number) => (
            <View key={index} style={styles.invoiceCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDate}>{item.date}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>{item.amount}</Text>
                  <TouchableOpacity style={styles.dlBtn} onPress={() => openInvoice(item)}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <Polyline points="7 10 12 15 17 10" />
                      <Line x1="12" y1="15" x2="12" y2="3" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>

              {activeTab === 'Meeting Rooms' && (
                <TouchableOpacity style={styles.cardBottom} onPress={() => openAgreement(item)} activeOpacity={0.7}>
                  <View style={styles.agreementLeft}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <Polyline points="14 2 14 8 20 8" />
                      <Line x1="16" y1="13" x2="8" y2="13" />
                      <Line x1="16" y1="17" x2="8" y2="17" />
                      <Polyline points="10 9 9 9 8 9" />
                    </Svg>
                    <Text style={styles.agreementTxt}>View Booking Agreement</Text>
                  </View>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="9 18 15 12 9 6" />
                  </Svg>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      <InvoicePreviewModal 
        visible={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)}
        invoice={selectedInvoice}
      />
      <BookingAgreementModal
        visible={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        invoice={selectedInvoice}
      />
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
  },
  backBtn: {
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFD4C5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  summaryLbl: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND,
  },
  summaryRightLbl: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryRightVal: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND,
  },
  tabsWrapper: {
    marginBottom: 24,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: BRAND,
  },
  tabTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  tabTxtActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: MUTED,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },
  dlBtn: {
    padding: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  agreementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agreementTxt: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  }
});
