import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getUserItems, deleteMarketplaceItem } from '../../utils/marketplaceService';
import { deleteImage } from '../../utils/imageService';

export default function ProfileScreen({ navigation }) {
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
      console.error(err);
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
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item) => {
    try {
      // If the item has an image, attempt to delete it from storage first
      if (item.image_url) {
        await deleteImage(item.image_url);
      }
      // Then, delete the item record from the database
      await deleteMarketplaceItem(item.id);
      
      Alert.alert("Success", "Item deleted successfully.");
      loadUserItems(true); // Refresh the list

    } catch (err) {
      Alert.alert("Error", `Failed to delete item: ${err.message}`);
    }
  };

  const handleEdit = (item) => {
    navigation.navigate('EditItem', { item });
  };
  
  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title title={item.title} subtitle={`$${item.price.toFixed(2)}`} />
      {item.image_url && <Card.Cover source={{ uri: item.image_url }} />}
      <Card.Actions>
        <Button onPress={() => handleEdit(item)}>Edit</Button>
        <Button onPress={() => handleDelete(item)} color="red">Delete</Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <FlatList
      data={userItems}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={<Title style={styles.headerTitle}>My Listings</Title>}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text>You haven't posted any items yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  }
});