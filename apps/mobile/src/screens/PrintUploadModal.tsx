import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const BRAND = '#FE7A47';
const TEAL = '#2DD4BF';
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';

export default function PrintUploadModal({ visible, onClose, onUploadComplete }: { visible: boolean; onClose: () => void; onUploadComplete: () => void; }) {
  const [isUploading, setIsUploading] = useState(false);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setIsUploading(false);
    }
  }, [visible]);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      onUploadComplete();
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isUploading ? 'Uploading...' : 'Print Request'}</Text>
              <Text style={styles.subtitle}>
                {isUploading ? 'Please wait while we process your file' : 'Upload your files to print'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={isUploading}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Line x1="18" y1="6" x2="6" y2="18" />
                <Line x1="6" y1="6" x2="18" y2="18" />
              </Svg>
            </TouchableOpacity>
          </View>

          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <View style={styles.spinnerBox}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 12a9 9 0 1 1-6.219-8.56" stroke={BRAND} />
                </Svg>
                {/* Fake spinner animation can be added if needed, or use ActivityIndicator */}
                <View style={StyleSheet.absoluteFill}>
                  <ActivityIndicator size="large" color={BRAND} style={{ transform: [{ scale: 1.5 }] }} />
                </View>
              </View>
              <Text style={styles.uploadingText}>Uploading document...</Text>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {/* Document Option */}
              <TouchableOpacity style={styles.optionCard} activeOpacity={0.7} onPress={handleUpload}>
                <View style={[styles.iconBox, { backgroundColor: BRAND }]}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <Polyline points="14 2 14 8 20 8" />
                    <Line x1="16" y1="13" x2="8" y2="13" />
                    <Line x1="16" y1="17" x2="8" y2="17" />
                    <Polyline points="10 9 9 9 8 9" />
                  </Svg>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Upload Document</Text>
                  <Text style={styles.optionSub}>PDF, DOC, DOCX</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <Polyline points="17 8 12 3 7 8" />
                  <Line x1="12" y1="3" x2="12" y2="15" />
                </Svg>
              </TouchableOpacity>

              {/* Photo Option */}
              <TouchableOpacity style={styles.optionCard} activeOpacity={0.7} onPress={handleUpload}>
                <View style={[styles.iconBox, { backgroundColor: TEAL }]}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <Circle cx="8.5" cy="8.5" r="1.5" />
                    <Polyline points="21 15 16 10 5 21" />
                  </Svg>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Upload Photo</Text>
                  <Text style={styles.optionSub}>JPG, PNG, HEIC</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <Polyline points="17 8 12 3 7 8" />
                  <Line x1="12" y1="3" x2="12" y2="15" />
                </Svg>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  subtitle: {
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
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 13,
    color: MUTED,
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  spinnerBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
  },
});
