import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { GET_MY_CENTERS } from '../lib/apollo/operations';

const BRAND = '#FE7A47';
const DARK = '#1A1D1F';
const MUTED = '#9CA3AF';
const BORDER = '#F3F4F6';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LocationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation<any>();
  const { data } = useQuery(GET_MY_CENTERS);

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [search, setSearch] = useState('');

  // Map real centers to the { id, name, sub } shape the list expects.
  const locations = (data?.myCenters || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    sub: `${c.location?.city || '—'} · ${c.floors?.length || 0} floor${(c.floors?.length || 0) === 1 ? '' : 's'}`,
  }));

  const filtered = locations.filter((l: any) =>
    !search.trim() ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.sub.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Location</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={styles.searchIcon}>
                <Circle cx="11" cy="11" r="8" />
                <Path d="M21 21l-4.3-4.3" />
              </Svg>
              <TextInput 
                style={styles.searchInput}
                placeholder="Search city or space..."
                placeholderTextColor={MUTED}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {filtered.length === 0 && (
              <Text style={{ textAlign: 'center', padding: 24, color: MUTED }}>
                {data ? 'No centers found' : 'Loading centers...'}
              </Text>
            )}
            {filtered.map((loc: any) => {
              const isActive = loc.id === activeId;
              
              return (
                <TouchableOpacity 
                  key={loc.id}
                  style={[styles.locItem, isActive && styles.locItemActive]}
                  onPress={() => {
                    setActiveId(loc.id);
                    // In a real app we might close immediately after selection
                  }}
                >
                  <View style={[styles.iconBox, isActive ? styles.iconBoxActive : styles.iconBoxInactive]}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#fff" : "#6B7280"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <Circle cx="12" cy="10" r="3" />
                    </Svg>
                  </View>
                  
                  <View style={styles.locInfo}>
                    <Text style={[styles.locName, isActive && styles.locNameActive]}>{loc.name}</Text>
                    <Text style={styles.locSub}>{loc.sub}</Text>
                  </View>

                  {isActive && (
                    <View style={styles.checkCircle}>
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Polyline points="20 6 9 17 4 12" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <SafeAreaView style={{backgroundColor: '#fff'}} />
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
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    height: '100%',
  },

  // List
  listContent: {
    paddingBottom: 24,
  },
  locItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  locItemActive: {
    backgroundColor: '#FFF8F3', // Light orange tint
  },
  
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: BRAND,
  },
  iconBoxInactive: {
    backgroundColor: '#F3F4F6',
  },
  
  locInfo: {
    flex: 1,
  },
  locName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  locNameActive: {
    color: BRAND,
  },
  locSub: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },
  
  checkCircle: {
    width: 24,
    height: 24,
    backgroundColor: BRAND,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
