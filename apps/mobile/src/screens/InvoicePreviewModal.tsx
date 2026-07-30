import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Rect, Polyline, Line } from 'react-native-svg';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';

export default function InvoicePreviewModal({ visible, onClose, invoice }: any) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Polyline points="14 2 14 8 20 8" />
                <Line x1="16" y1="13" x2="8" y2="13" />
                <Line x1="16" y1="17" x2="8" y2="17" />
                <Polyline points="10 9 9 9 8 9" />
              </Svg>
            </View>
            <View style={styles.headerTitleBox}>
              <Text style={styles.title}>Invoice Preview</Text>
              <Text style={styles.subtitle}>#676 · {invoice?.title || 'Meeting Room A'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.invoiceDoc}>
              
              {/* Doc Header */}
              <View style={styles.docHeader}>
                <Text style={styles.gstTxt}>GST IN : 03AAUFD7892F1ZZ</Text>
                <View style={styles.logoBox}>
                  <Text style={styles.logoTxt}>SPACE{'\n'}JAM</Text>
                  <Text style={styles.logoSubTxt}>co-working{'\n'}offices</Text>
                </View>
              </View>

              {/* Doc Body */}
              <View style={styles.docBody}>
                <View style={styles.docRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docLabel}>Billed to</Text>
                    <Text style={styles.docBoldTxt}>Ms. Dikshita Bansal</Text>
                    <Text style={styles.docMutedTxt}>H.NO.2121, 1st Floor, Block C</Text>
                    <Text style={styles.docMutedTxt}>Aerocity Road SAS Nagar,</Text>
                    <Text style={styles.docMutedTxt}>Punjab 140306 India</Text>
                    <Text style={styles.docMutedTxt}>bansal.dikshita04@gmail.com</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={styles.metaRow}><Text style={styles.docLabel}>Invoice Number:</Text><Text style={styles.metaVal}>676</Text></View>
                    <View style={styles.metaRow}><Text style={styles.docLabel}>Invoice generated:</Text><Text style={styles.metaVal}>January 18, 2026</Text></View>
                    <View style={styles.metaRow}><Text style={styles.docLabel}>Payment Due Date:</Text><Text style={styles.metaVal}>January 18, 2026</Text></View>
                    <View style={styles.metaRow}><Text style={styles.docLabel}>Amount Due (INR):</Text><Text style={[styles.metaVal, { fontWeight: '700' }]}>₹354.00</Text></View>
                  </View>
                </View>

                <Text style={styles.userGst}>GST IN : 03BWVPB2164C1ZW</Text>
                <View style={styles.divider} />

                {/* Table */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.thTxt, { flex: 2 }]}>SERVICES</Text>
                  <Text style={[styles.thTxt, { flex: 1, textAlign: 'center' }]}>QUANTITY</Text>
                  <Text style={[styles.thTxt, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
                  <Text style={[styles.thTxt, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
                </View>

                <View style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdBold}>Open Workstation</Text>
                    <Text style={styles.tdMuted}>Membership: Jan-2026</Text>
                  </View>
                  <Text style={[styles.tdTxt, { flex: 1, textAlign: 'center' }]}>1</Text>
                  <Text style={[styles.tdTxt, { flex: 1, textAlign: 'right' }]}>₹300.00</Text>
                  <Text style={[styles.tdTxt, { flex: 1, textAlign: 'right' }]}>₹300.00</Text>
                </View>

                <View style={styles.divider} />

                {/* Totals */}
                <View style={styles.totalsContainer}>
                  <View style={styles.totalRow}><Text style={styles.totalLbl}>Subtotal:</Text><Text style={styles.totalVal}>₹ 300.00</Text></View>
                  <View style={styles.totalRow}><Text style={styles.totalLbl}>CGST 9% (03AAUFD7892F1ZZ):</Text><Text style={styles.totalVal}>₹ 27.00</Text></View>
                  <View style={styles.totalRow}><Text style={styles.totalLbl}>SGST 9% (03AAUFD7892F1ZZ):</Text><Text style={styles.totalVal}>₹ 27.00</Text></View>
                  <View style={styles.dividerSmall} />
                  <View style={styles.totalRow}><Text style={[styles.totalLbl, { fontWeight: '700', color: DARK }]}>Total:</Text><Text style={[styles.totalVal, { fontWeight: '700', color: DARK }]}>₹354.00</Text></View>
                  <View style={styles.totalRow}><Text style={[styles.totalLbl, { fontWeight: '700', color: DARK }]}>Amount Due (INR):</Text><Text style={[styles.totalVal, { fontWeight: '700', color: DARK }]}>₹354.00</Text></View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.bankTitle}>SpaceJam Bank Details</Text>
                <Text style={styles.docMutedTxt}>Name : D & A</Text>
                <Text style={styles.docMutedTxt}>A/C No. : 777705432198</Text>
                <Text style={styles.docMutedTxt}>IFSC Code : ICIC0000964</Text>
                <Text style={styles.docMutedTxt}>Bank Name: ICICI</Text>

              </View>
            </View>
          </ScrollView>

          <SafeAreaView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.dlBtn} activeOpacity={0.8}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <Polyline points="7 10 12 15 17 10" />
                  <Line x1="12" y1="15" x2="12" y2="3" />
                </Svg>
                <Text style={styles.dlBtnTxt}>Download Invoice PDF</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  invoiceDoc: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  docHeader: {
    backgroundColor: BRAND,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gstTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoTxt: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  logoSubTxt: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 11,
  },
  docBody: {
    padding: 24,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  docLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
    marginBottom: 8,
  },
  docBoldTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  docMutedTxt: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  metaVal: {
    fontSize: 11,
    color: DARK,
    textAlign: 'right',
    width: 90,
  },
  userGst: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  dividerSmall: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  thTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tdBold: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  tdMuted: {
    fontSize: 10,
    color: MUTED,
  },
  tdTxt: {
    fontSize: 11,
    color: MUTED,
  },
  totalsContainer: {
    alignItems: 'flex-end',
    paddingLeft: 40,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  totalLbl: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },
  totalVal: {
    fontSize: 11,
    color: MUTED,
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  dlBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dlBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  }
});
