import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE_MUTATION } from '../lib/apollo/operations';
import { useAuth } from '../lib/auth/context';
import Toast from 'react-native-toast-message';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg';

const BRAND = '#FE7A47';
const BRAND_LIGHT = '#FFCDB9'; // lighter shade for save button
const DARK = '#1A1D1F';
const MUTED = '#6F767E';
const BORDER = '#E5E7EB';
const BG = '#fff';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || ''); // Readonly for now

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE_MUTATION, {
    onCompleted: async () => {
      await refreshUser();
      Toast.show({ type: 'success', text1: 'Profile Updated' });
      navigation.goBack();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err.message });
    }
  });

  const handleSave = () => {
    updateProfile({ variables: { name } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.editIconBtn}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          
          {/* Full Name */}
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.inputValue}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            </View>
          </View>
          
          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <Polyline points="22,6 12,13 2,6" />
              </Svg>
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Email (Read-only)</Text>
              <Text style={styles.inputValue}>{email}</Text>
            </View>
          </View>

        </View>

        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave}>
          <Text style={styles.saveBtnTxt}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginLeft: 8,
  },
  editIconBtn: {
    padding: 8,
    marginRight: -8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
    fontWeight: '500',
  },
  inputValue: {
    fontSize: 16,
    color: DARK,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 36,
  },
  saveBtn: {
    backgroundColor: BRAND_LIGHT,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
