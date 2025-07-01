import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, uploadImage } from '../../utils/imageService';
import { createMarketplaceItem } from '../../utils/marketplaceService';

const categories = [
  { label: 'Textbooks', value: 'textbooks' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Sports', value: 'sports' },
  { label: 'Other', value: 'other' },
];

export default function AddItemScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { uri, error } = await pickImage();
    if (error) Alert.alert('Error', 'Failed to pick image.');
    else if (uri) setSelectedImage(uri);
  };

  const handleSubmit = async () => {
    if (!title || !price || !category) {
      Alert.alert('Missing Information', 'Please fill out title, price, and select a category.');
      return;
    }

    setLoading(true);
    let imageUrl = null;

    try {
      if (selectedImage) {
        const { url, error: uploadError } = await uploadImage(selectedImage);
        if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);
        imageUrl = url;
      }

      const itemData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category,
        condition: 'good',
        image_url: imageUrl,
      };

      const { error: createError } = await createMarketplaceItem(itemData);
      if (createError) throw new Error('Failed to create item: ' + createError.message);

      Alert.alert('Success', 'Item posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Title</Text>
        <TextInput mode="outlined" value={title} onChangeText={setTitle} outlineColor={theme.colors.surface} activeOutlineColor={theme.colors.primary} style={{marginBottom: 20}} />

        <Text style={styles.label}>Price</Text>
        <TextInput mode="outlined" value={price} onChangeText={setPrice} keyboardType="numeric" outlineColor={theme.colors.surface} activeOutlineColor={theme.colors.primary} style={{marginBottom: 20}} />
        
        <Text style={styles.label}>Description</Text>
        <TextInput mode="outlined" value={description} onChangeText={setDescription} multiline numberOfLines={4} outlineColor={theme.colors.surface} activeOutlineColor={theme.colors.primary} style={{marginBottom: 20}} />
        
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <Chip
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              style={[styles.chip, category === cat.value && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
              textStyle={{color: category === cat.value ? '#FFF' : theme.colors.placeholder }}
            >
              {cat.label}
            </Chip>
          ))}
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          ) : (
            <Icon name="photo-camera" size={32} color={theme.colors.placeholder} />
          )}
        </TouchableOpacity>
      </ScrollView>
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 8 }]}>
        <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonText}
        >
            Save
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    opacity: 0.8,
    fontWeight: '600',
    marginTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1,
  },
  imagePicker: {
    height: 150,
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    overflow: 'hidden',
  },
  imagePreview: {
      width: '100%',
      height: '100%',
  },
  buttonContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderColor: '#1F2937',
  },
  button: { borderRadius: 12, paddingVertical: 10 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});