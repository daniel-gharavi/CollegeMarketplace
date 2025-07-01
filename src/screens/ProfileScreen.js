import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Title, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getUserItems, deleteMarketplaceItem } from '../../utils/marketplaceService';
import { deleteImage } from '../../utils/imageService';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserItems = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data, error } = await getUserItems();
      if (error) throw error;
      setUserItems(data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load your items.");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserItems(true);
    setRefreshing(false);
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item) => {
    try {
      if (item.image_url) await deleteImage(item.image_url);
      await deleteMarketplaceItem(item.id);
      Alert.alert("Success", "Item deleted.");
      loadUserItems(true);
    } catch (err) {
      Alert.alert("Error", `Failed to delete item: ${err.message}`);
    }
  };

  const handleEdit = (item) => {
    navigation.navigate('EditItem', { item });
  };
  
  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      {item.image_url && <Card.Cover source={{ uri: item.image_url }} />}
      <Card.Content style={styles.cardContent}>
        {/*
          THIS IS THE FIX: We are now using standard <Text> components
          and applying the dark color directly from the theme.
        */}
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>{`$${item.price.toFixed(2)}`}</Text>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="contained" 
          onPress={() => handleEdit(item)} 
          style={styles.cardButton}
          buttonColor="#EAEAEA"
          textColor="#000"
          labelStyle={styles.buttonLabel}
        >
          Edit
        </Button>
        <Button 
          mode="contained" 
          onPress={() => handleDelete(item)} 
          buttonColor={theme.colors.primary}
          style={styles.cardButton}
          labelStyle={styles.buttonLabel}
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={userItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={<Title style={[styles.headerTitle, { color: theme.colors.text }]}>My Listings</Title>}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{color: theme.colors.text}}>You haven't posted any items yet.</Text>
            </View>
          }
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F1D3A', // Force dark blue color for title
  },
  itemPrice: {
    fontSize: 16,
    color: '#0F1D3A', // Force dark blue color for price
    opacity: 0.8,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    gap: 8,
  },
  cardButton: {
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});