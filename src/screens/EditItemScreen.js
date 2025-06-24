import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { updateMarketplaceItem } from '../../utils/marketplaceService';

export default function EditItemScreen({ route, navigation }) {
  const { item } = route.params;

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price.toString());
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!title.trim() || !price.trim() || isNaN(parseFloat(price))) {
      Alert.alert("Invalid Input", "Please ensure title and a valid price are filled out.");
      return;
    }

    setLoading(true);
    const updates = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
    };

    try {
      const { error } = await updateMarketplaceItem(item.id, updates);
      if (error) throw error;
      Alert.alert('Success', 'Item updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update item.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Item</Text>
      <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={styles.input} />
      <TextInput label="Price ($)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={styles.input} />
      <Button mode="contained" onPress={handleUpdate} loading={loading} style={styles.submitButton}>
        Save Changes
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 16 },
  submitButton: { marginTop: 16, paddingVertical: 8 },
});