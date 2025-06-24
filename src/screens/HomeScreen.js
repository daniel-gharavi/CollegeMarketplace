// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, RefreshControl, Alert, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Searchbar, Card, FAB, Text, ActivityIndicator, IconButton, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarketplaceItems, searchMarketplaceItems } from '../../utils/marketplaceService';
import { supabase } from '../../utils/supabase';

const numCols = 2;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / numCols; // 16px margin on each side + spacing

export default function HomeScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const firstName = route?.params?.firstName;
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Animation for dropdown menu
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Load marketplace items on component mount
  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  // Set up header with menu button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="dots-vertical"
          size={24}
          onPress={() => toggleMenu()}
          disabled={signingOut}
        />
      ),
    });
  }, [navigation, signingOut]);

  // Animate menu visibility
  useEffect(() => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuVisible]);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleProfilePress = () => {
    closeMenu();
    navigation.navigate('Profile');
  };

  const handleSignOut = () => {
    closeMenu();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]
    );
  };

  const performSignOut = async () => {
    try {
      setSigningOut(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
        console.error('Sign out error:', error);
        setSigningOut(false);
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      console.error('Sign out error:', err);
      setSigningOut(false);
    }
  };

  const loadMarketplaceItems = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError('');
      const { data, error } = await getMarketplaceItems();
      
      if (error) {
        setError('Failed to load marketplace items');
        console.error('Error loading items:', error);
      } else {
        setAllItems(data || []);
        setItems(data || []);
      }
    } catch (err) {
      setError('Failed to load marketplace items');
      console.error('Error loading items:', err);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearch('');
    setSelectedCategory(null);
    await loadMarketplaceItems(true);
    setRefreshing(false);
  };

  const onSearchChange = async (query) => {
    setSearch(query);
    setSelectedCategory(null); // Clear category filter when searching
    
    if (query.trim() === '') {
      setItems(allItems);
      setSearching(false);
    } else {
      setSearching(true);
      try {
        const { data, error } = await searchMarketplaceItems(query.trim());
        if (error) {
          console.error('Search error:', error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }
  };
  
  const handleCategorySelect = (category) => {
    setSearch(''); // Clear search when filtering by category
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setItems(allItems);
    } else {
      setSelectedCategory(category);
      const filteredItems = allItems.filter(item => item.category === category);
      setItems(filteredItems);
    }
  };

  const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;
  const formatCondition = (condition) => (condition ? condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');
  const formatCategory = (category) => (category ? category.replace(/\b\w/g, l => l.toUpperCase()) : '');
  const getCategoryIcon = (category) => ({ textbooks: 'book', electronics: 'devices', furniture: 'chair', clothing: 'checkroom', sports: 'sports-basketball', other: 'category' }[category] || 'category');
  const getConditionColor = (condition) => ({ 'new': '#4CAF50', 'like_new': '#8BC34A', 'good': '#FFC107', 'fair': '#FF9800', 'poor': '#F44336' }[condition] || '#757575');

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { item })}
    >
      <Card.Cover
        source={
          item.image_url && item.image_url.trim() !== ''
            ? { uri: item.image_url }
            : require('../../assets/placeholder.png')
        }
        style={styles.cover}
      />
      <Card.Content style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Loading marketplace...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {menuVisible && (
        <>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu} />
          <Animated.View style={[styles.dropdown, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleProfilePress} disabled={signingOut}>
              <Icon name="person" size={20} color="#666" style={styles.menuIcon} />
              <Text style={styles.menuText}>My Profile</Text>
            </TouchableOpacity>
            <Divider style={styles.menuDivider} />
            <TouchableOpacity style={[styles.menuItem, signingOut && styles.menuItemDisabled]} onPress={handleSignOut} disabled={signingOut}>
              {signingOut ? (<View style={styles.signingOutContainer}><ActivityIndicator size="small" color="#666" style={styles.signingOutLoader} /><Text style={[styles.menuText, styles.signingOutText]}>Signing out...</Text></View>) : (<><Icon name="logout" size={20} color="#666" style={styles.menuIcon} /><Text style={styles.menuText}>Sign Out</Text></>)}
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <Searchbar placeholder="Search items..." onChangeText={onSearchChange} value={search} style={styles.search} loading={searching} />
      
      <View style={styles.chipContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'other'].map(cat => (
            <Chip
              key={cat}
              mode={selectedCategory === cat ? 'flat' : 'outlined'}
              onPress={() => handleCategorySelect(cat)}
              style={styles.chip}
              icon={getCategoryIcon(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <FlatList
          data={items}
          numColumns={numCols}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{search || selectedCategory ? 'No items found' : 'No items available'}</Text></View>}
        />
      )}

      <FAB icon="plus" style={[styles.fab, { bottom: 16 + insets.bottom }]} onPress={() => navigation.navigate('Add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  search: { margin: 8, },
  list: { paddingHorizontal: 8 },
  card: { width: CARD_WIDTH, margin: 4, },
  cover: { height: CARD_WIDTH },
  cardContent: { padding: 8 },
  title: { marginBottom: 4, fontSize: 14, fontWeight: 'bold', lineHeight: 18, },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', },
  fab: { position: 'absolute', right: 16, },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 16, fontSize: 14, color: '#f00' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { marginTop: 16, fontSize: 14, color: '#666' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', zIndex: 999, },
  dropdown: { position: 'absolute', top: 0, right: 4, backgroundColor: 'white', borderRadius: 4, paddingVertical: 4, minWidth: 160, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 4, zIndex: 1000, },
  menuItem: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', minHeight: 48, },
  menuItemDisabled: { opacity: 0.6 },
  menuText: { fontSize: 16, color: '#212121', marginLeft: 32, },
  menuIcon: { position: 'absolute', left: 16, },
  menuDivider: { marginVertical: 4, },
  signingOutContainer: { flexDirection: 'row', alignItems: 'center', },
  signingOutLoader: { marginRight: 8, },
  signingOutText: { color: '#666', },
  chipContainer: { paddingHorizontal: 8, paddingBottom: 8, },
  chip: { marginRight: 8, },
});