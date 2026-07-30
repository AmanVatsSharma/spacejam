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

const BRAND = '#FE7A47';
const BRAND_BG = '#FFF0EB';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function PrintPreviewScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false); // false = Black & White
  const [isLandscape, setIsLandscape] = useState(false); // false = Portrait

  const estimatedCost = copies * (isColor ? 10 : 5) * 5; // Fake cost logic (assuming 5 pages)

  const decreaseCopies = () => {
    if (copies > 1) setCopies(copies - 1);
  };
  const increaseCopies = () => {
    setCopies(copies + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Preview Document</Text>
          <Text style={styles.headerSubtitle}>Review before submitting</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onBack}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="18" y1="6" x2="6" y2="18" />
            <Line x1="6" y1="6" x2="18" y2="18" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Success Alert */}
        <View style={styles.alertBox}>
          <View style={styles.alertIconWrapper}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M9 12l2 2 4-4" />
            </Svg>
          </View>
          <View>
            <Text style={styles.alertTitle}>Document Uploaded</Text>
            <Text style={styles.alertSub}>Ready for printing</Text>
          </View>
        </View>

        {/* Preview Box */}
        <View style={styles.previewBox}>
          <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Polyline points="14 2 14 8 20 8" />
            <Line x1="16" y1="13" x2="8" y2="13" />
            <Line x1="16" y1="17" x2="8" y2="17" />
            <Polyline points="10 9 9 9 8 9" />
          </Svg>
          <Text style={styles.pageCountTxt}>Page 1 of 5</Text>
        </View>

        {/* Config Card */}
        <View style={styles.configCard}>
          {/* Copies */}
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Number of Copies</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decreaseCopies} style={styles.stepBtn}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="15 18 9 12 15 6" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{copies}</Text>
              <TouchableOpacity onPress={increaseCopies} style={styles.stepBtn}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.divider} />

          {/* Print Type */}
          <View style={styles.configSection}>
            <Text style={styles.configLabel}>Print type</Text>
            
            <TouchableOpacity style={styles.radioOption} activeOpacity={0.8} onPress={() => setIsColor(false)}>
              <View style={styles.radioBox}>
                {!isColor ? (
                  <View style={styles.radioInner}>
                    <View style={styles.radioDot} />
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </View>
              <Text style={styles.radioTxt}>Black & White</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.radioOption} activeOpacity={0.8} onPress={() => setIsColor(true)}>
              <View style={styles.radioBox}>
                {isColor ? (
                  <View style={styles.radioInner}>
                    <View style={styles.radioDot} />
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </View>
              <Text style={styles.radioTxt}>Color</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Orientation */}
          <View style={styles.configSection}>
            <Text style={styles.configLabel}>Orientation</Text>
            
            <TouchableOpacity style={styles.radioOption} activeOpacity={0.8} onPress={() => setIsLandscape(false)}>
              <View style={styles.radioBox}>
                {!isLandscape ? (
                  <View style={styles.radioInner}>
                    <View style={styles.radioDot} />
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </View>
              <Text style={styles.radioTxt}>Portrait</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.radioOption} activeOpacity={0.8} onPress={() => setIsLandscape(true)}>
              <View style={styles.radioBox}>
                {isLandscape ? (
                  <View style={styles.radioInner}>
                    <View style={styles.radioDot} />
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </View>
              <Text style={styles.radioTxt}>Landscape</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost */}
        <View style={styles.costRow}>
          <Text style={styles.costLbl}>Estimated Cost</Text>
          <Text style={styles.costVal}>{estimatedCost}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => onNavigate('PrintProcessing')}>
          <Text style={styles.confirmBtnTxt}>Confirm & Print</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_BG,
    borderWidth: 1,
    borderColor: '#FFD4C5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertIconWrapper: {
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 13,
    color: MUTED,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    marginBottom: 24,
  },
  pageCountTxt: {
    marginTop: 16,
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },
  configCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  configLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginBottom: 12, // mainly for sections
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepBtn: {
    padding: 4,
  },
  stepperVal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  configSection: {
    // container for radio groups
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioBox: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  costLbl: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  costVal: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: MUTED,
  },
  confirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
