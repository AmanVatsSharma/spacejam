import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const BRAND = '#FE7A47';
const BRAND_BG = '#FFF0EB'; // Light orange background for active/expanded states
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function SupportScreen(): ()) {
  const navigation = useNavigation<any>();

  const [expandedFaq, setExpandedFaq] = useState<number>(0); // first item expanded by default

  const faqs = [
    {
      question: 'How do I book a meeting room?',
      answer: 'Simply select your preferred location and room from the booking section, choose your time slot, and confirm. You\'ll receive a confirmation instantly.',
    },
    {
      question: 'Can I cancel or modify a booking?',
      answer: 'Yes, you can cancel or modify your booking from the "My Bookings" page up to 24 hours before the scheduled time.',
    },
    {
      question: 'How do I submit a print request?',
      answer: 'Navigate to the "Prints" tab in the Bookings section and follow the instructions to upload your documents.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit cards, debit cards, UPI, and net banking for all transactions.',
    },
    {
      question: 'Where can I find my receipts?',
      answer: 'Receipts are available in the "My Bookings" section under the "Completed" tab. Click on a booking to view or download the receipt.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style=()>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Feedback</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Send Feedback Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={styles.cardTitle}>Send Feedback</Text>
          </View>

          <Text style={styles.inputLabel}>Category</Text>
          <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
            <Text style={styles.dropdownValue}>Select Category</Text>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="6 9 12 15 18 9" />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Description</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us more about your feedback..."
              placeholderTextColor={MUTED}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8}>
            <Text style={styles.submitBtnTxt}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQ..."
            placeholderTextColor={MUTED}
          />
        </View>

        <View style={styles.faqList}>
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.faqItem} 
                activeOpacity={0.7}
                onPress={() => setExpandedFaq(isExpanded ? -1 : index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isExpanded ? (
                      <Polyline points="18 15 12 9 6 15" />
                    ) : (
                      <Polyline points="6 9 12 15 18 9" />
                    )}
                  </Svg>
                </View>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Feedback Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', // very light grey for input
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },
  dropdownValue: {
    fontSize: 15,
    color: DARK, // Or placeholder color if unselected, but let's assume selected/placeholder
  },
  textAreaContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    height: 120,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: DARK,
  },
  submitBtn: {
    backgroundColor: BRAND,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // FAQ Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    fontSize: 15,
    color: DARK,
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    flex: 1,
    paddingRight: 16,
  },
  faqAnswerContainer: {
    backgroundColor: BRAND_BG,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },
});
