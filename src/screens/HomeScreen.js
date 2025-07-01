import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, RefreshControl, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Searchbar, Card, FAB, Text, ActivityIndicator, IconButton, Divider, Title, useTheme, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarketplaceItems } from '../../utils/marketplaceService';
import { supabase } from '../../utils/supabase';
import { useFocusEffect } from '@react-navigation/native';

const numCols = 2;
const { width } = Dimensions.get('window');
const SPACING = 16;
const CARD_WIDTH = (width - (SPACING * 3)) / numCols;

const categories = [
  { label: 'Textbooks', value: 'textbooks' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Sports', value: 'sports' },
  { label: 'Other', value: 'other' },
];

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Title style={styles.headerTitle}>HooMart</Title>,
      headerRight: () => <IconButton icon="dots-vertical" iconColor={theme.colors.text} size={24} onPress={() => setMenuVisible(true)} />,
    });
  }, [navigation, theme]);

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: menuVisible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [menuVisible]);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await getMarketplaceItems();
    setAllItems(data || []);
    setFilteredItems(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCategorySelect = (categoryValue) => {
    setSearch('');
    if (selectedCategory === categoryValue) {
      setSelectedCategory(null);
      setFilteredItems(allItems);
    } else {
      setSelectedCategory(categoryValue);
      setFilteredItems(allItems.filter(item => item.category === categoryValue));
    }
  };

  const handleSearch = (query) => {
    setSearch(query);
    setSelectedCategory(null);
    if (query) {
      setFilteredItems(allItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase())));
    } else {
      setFilteredItems(allItems);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={() => navigation.navigate('Detail', { item })}>
        <Card.Cover source={item.image_url ? { uri: item.image_url } : require('../../assets/placeholder.png')} style={styles.cover} />
        <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{`$${item.price}`}</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {menuVisible && (
        <>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <Animated.View style={[styles.dropdown, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }}>
              <Icon name="person" size={20} color="#333" />
              <Text style={styles.menuText}>My Profile</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Settings'); }}>
              <Icon name="settings" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                <Icon name="logout" size={20} color="#333" />
                <Text style={styles.menuText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <Searchbar
  placeholder="Search"
  onChangeText={handleSearch}
  value={search}
  style={styles.search}
  inputStyle={{ color: theme.colors.text }}
  iconColor={theme.colors.placeholder}
  placeholderTextColor={theme.colors.placeholder}
/>
      
      <View style={styles.chipContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(cat => (
            <Chip
              key={cat.value}
              onPress={() => handleCategorySelect(cat.value)}
              style={[styles.chip, selectedCategory === cat.value && { backgroundColor: theme.colors.primary }]}
              textStyle={[styles.chipText, {color: selectedCategory === cat.value ? '#FFF' : theme.colors.placeholder}]}
            >
              {cat.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={numCols}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadItems} />}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('Add')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1D3A' },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#FFFFFF' },
  search: { 
    marginHorizontal: SPACING, 
    marginTop: 8, 
    marginBottom: 4, 
    borderRadius: 10, 
    backgroundColor: '#1A294B',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#3a4466'
  },
  chipContainer: { paddingHorizontal: SPACING, paddingVertical: 12 },
  chip: { marginRight: 8, backgroundColor: '#1A294B', borderColor: '#3a4466' },
  chipText: { fontFamily: 'Inter-SemiBold' },
  list: { paddingHorizontal: SPACING / 2 },
  cardContainer: {
    width: CARD_WIDTH,
    margin: SPACING / 2,
  },
  cover: { 
    height: 150, 
    borderRadius: 8, 
    backgroundColor: '#1A294B' 
  },
  textContainer: {
      marginTop: 8,
  },
  title: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 15,
    color: '#FFFFFF'
  },
  price: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 16, 
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fab: { position: 'absolute', right: 20, bottom: 20 },
  dropdown: { position: 'absolute', top: 5, right: 5, backgroundColor: 'white', borderRadius: 8, paddingVertical: 4, width: 180, elevation: 8, zIndex: 1000 },
  menuItem: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#000', marginLeft: 16, fontFamily: 'Inter-Regular' },
});