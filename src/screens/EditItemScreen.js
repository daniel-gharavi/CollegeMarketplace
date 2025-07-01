import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, Image, TouchableOpacity, View } from 'react-native';
import { TextInput, Button, Text, useTheme, Chip } from 'react-native-paper';
import { updateMarketplaceItem } from '../../utils/marketplaceService';
import { pickImage, uploadImage, deleteImage } from '../../utils/imageService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const categories = [
  { label: 'Textbooks', value: 'textbooks' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Sports', value: 'sports' },
  { label: 'Other', value: 'other' },
];

export default function EditItemScreen({ route, navigation }) {
  const { item } = route.params;
  const theme = useTheme();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price.toString());
  const [category, setCategory] = useState(item.category); // <-- State for category
  const [imageUri, setImageUri] = useState(item.image_url);
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { uri, error } = await pickImage();
    if (error) {
      Alert.alert('Error', 'Failed to pick new image.');
    } else if (uri) {
      setNewImageUri(uri);
    }
  };

  const handleUpdate = async () => {
    if (!title || !price || !category) {
      Alert.alert('Missing Information', 'Please fill out title, price, and category.');
      return;
    }
    
    setLoading(true);
    let finalImageUrl = imageUri;

    try {
      if (newImageUri) {
        const { url: newUrl, error: uploadError } = await uploadImage(newImageUri);
        if (uploadError) throw new Error('New image upload failed.');
        finalImageUrl = newUrl;

        if (imageUri) {
          await deleteImage(imageUri);
        }
      }

      const updates = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category, // <-- Include category in the update
        image_url: finalImageUrl,
      };

      const { error: updateError } = await updateMarketplaceItem(item.id, updates);
      if (updateError) throw updateError;

      Alert.alert('Success', 'Item updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (err) {
      Alert.alert('Error', 'Failed to update item. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Price</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
        
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline />

        {/* --- CATEGORY SELECTION UI --- */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <Chip
              key={cat.value}
              selected={category === cat.value}
              onPress={() => setCategory(cat.value)}
              style={[styles.chip, category === cat.value && { backgroundColor: theme.colors.primary }]}
              textStyle={{ color: category === cat.value ? '#FFF' : theme.colors.text }}
            >
              {cat.label}
            </Chip>
          ))}
        </View>

        <Text style={styles.label}>Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {newImageUri ? (
            <Image source={{ uri: newImageUri }} style={styles.imagePreview} />
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Icon name="photo-camera" size={32} color={theme.colors.placeholder} />
          )}
          <View style={styles.editOverlay}>
            <Text style={styles.editOverlayText}>Change Photo</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Button
        mode="contained"
        onPress={handleUpdate}
        loading={loading}
        disabled={loading}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Save Changes
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20 },
  label: { fontSize: 16, marginBottom: 8, opacity: 0.8 },
  input: { backgroundColor: '#1A294B', marginBottom: 20, fontSize: 16 },
  multiline: { height: 100, textAlignVertical: 'top' },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1A294B',
  },
  imagePicker: {
    height: 200,
    width: '100%',
    backgroundColor: '#1A294B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  imagePreview: {
    height: '100%',
    width: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  editOverlayText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: { marginHorizontal: 20, marginBottom: 40, borderRadius: 12, paddingVertical: 10 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});