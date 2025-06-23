// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, RefreshControl, Alert, TouchableOpacity, Animated } from 'react-native';
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

  // Handle profile navigation (placeholder for now)
  const handleProfilePress = () => {
    closeMenu();
    Alert.alert('Profile', 'Profile page coming soon!');
  };

  // Handle sign out
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
      
      // Add a delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
        console.error('Sign out error:', error);
        setSigningOut(false);
      } else {
        // Add another small delay before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate back to login screen and clear the navigation stack
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

  // Test the image URL that's failing
  const testFailingImageUrl = async () => {
    const testUrl = "https://oogqnuynwhkrkcilhpbv.supabase.co/storage/v1/object/public/marketplace-images/1750644448268-xcs6s8di51.jpeg";
    try {
      const response = await fetch(testUrl);
      console.log('Image URL test result:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response body:', text);
    } catch (error) {
      console.log('Image URL test error:', error);
    }
  };

  useEffect(() => {
    testFailingImageUrl();
  }, []);

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
        console.log('Loaded items:', data?.length, 'items');
        // Debug: Log first item's image URL
        if (data && data.length > 0) {
          console.log('First item image_url:', data[0].image_url);
        }
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
    // Clear search when refreshing to show all items
    setSearch('');
    await loadMarketplaceItems(true);
    setRefreshing(false);
  };

  const onSearchChange = async (query) => {
    setSearch(query);
    
    if (query.trim() === '') {
      // If search is empty, show all items
      setItems(allItems);
      setSearching(false);
    } else {
      // Search in the database
      setSearching(true);
      try {
        const { data, error } = await searchMarketplaceItems(query.trim());
        if (error) {
          console.error('Search error:', error);
          // Fallback to local search if database search fails
          setItems(
            allItems.filter(item =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description?.toLowerCase().includes(query.toLowerCase()) ||
              item.category?.toLowerCase().includes(query.toLowerCase())
            )
          );
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        // Fallback to local search
        setItems(
          allItems.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.category?.toLowerCase().includes(query.toLowerCase())
          )
        );
      } finally {
        setSearching(false);
      }
    }
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatCondition = (condition) => {
    if (!condition) return '';
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCategory = (category) => {
    if (!category) return '';
    return category.replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryIcon = (category) => {
    const icons = {
      textbooks: 'book',
      electronics: 'devices',
      furniture: 'chair',
      clothing: 'checkroom',
      sports: 'sports-basketball',
      other: 'category'
    };
    return icons[category] || 'category';
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: '#4CAF50',
      like_new: '#8BC34A',
      good: '#FFC107',
      fair: '#FF9800',
      poor: '#F44336'
    };
    return colors[condition] || '#757575';
  };

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
        onError={(error) => {
          console.log('Image load error for item:', item.id, 'URL:', item.image_url, 'Error:', error);
        }}
      />
      <Card.Content style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        
        {/* Category and Condition Info */}
        <View style={styles.infoContainer}>
          {item.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{formatCategory(item.category)}</Text>
            </View>
          )}
          
          {item.condition && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Condition:</Text>
              <Text style={[styles.infoValue, { color: getConditionColor(item.condition) }]}>
                {formatCondition(item.condition)}
              </Text>
            </View>
          )}
        </View>

        {item.profiles && (
          <Text style={styles.seller}>
            by {item.profiles.first_name} {item.profiles.last_name}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Dropdown Menu */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={closeMenu}
          />
          <Animated.View 
            style={[
              styles.dropdown,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleProfilePress}
              disabled={signingOut}
            >
              <Icon name="person" size={20} color="#666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <Divider style={styles.menuDivider} />
            <TouchableOpacity 
              style={[styles.menuItem, signingOut && styles.menuItemDisabled]} 
              onPress={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <View style={styles.signingOutContainer}>
                  <ActivityIndicator size="small" color="#666" style={styles.signingOutLoader} />
                  <Text style={[styles.menuText, styles.signingOutText]}>Signing out...</Text>
                </View>
              ) : (
                <>
                  <Icon name="logout" size={20} color="#666" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>
          {firstName ? `Welcome, ${firstName}!` : 'Welcome to College Marketplace'}
        </Text>
        <Text style={styles.welcomeSubtitle}>Find great deals from fellow students</Text>
      </View>
      
      <Searchbar
        placeholder="Search items..."
        onChangeText={onSearchChange}
        value={search}
        style={styles.search}
        loading={searching}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={numCols}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search ? 'No items found for your search' : 'No items available yet'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('Add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: { margin: 8 },
  list: { paddingHorizontal: 8 },
  card: {
    width: CARD_WIDTH,
    margin: 4,
  },
  cover: {
    height: CARD_WIDTH,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  price: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
  header: {
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#f00',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
    minWidth: 55,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  seller: {
    marginTop: 4,
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
  },
  // Dropdown Menu Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: 0, // Right under the header
    right: 4,
    backgroundColor: 'white',
    borderRadius: 4,
    paddingVertical: 4,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48, // Material Design minimum touch target
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 32, // Space for icon
  },
  menuIcon: {
    position: 'absolute',
    left: 16,
  },
  menuDivider: {
    marginVertical: 4,
  },
  signingOutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signingOutLoader: {
    marginRight: 8,
  },
  signingOutText: {
    color: '#666',
  },
});