// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, RefreshControl } from 'react-native';
import { Searchbar, Card, FAB, Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarketplaceItems, searchMarketplaceItems } from '../../utils/marketplaceService';

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
  const firstName = route?.params?.firstName;
  const insets = useSafeAreaInsets();

  // Load marketplace items on component mount
  useEffect(() => {
    loadMarketplaceItems();
  }, []);

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
      <Card.Content>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        {item.condition && (
          <Text style={styles.condition}>{item.condition}</Text>
        )}
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
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
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
  condition: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  seller: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});