// src/screens/AddItemScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMarketplaceItem } from '../../utils/marketplaceService';
import { pickImage, uploadImage, testStorageAccess } from '../../utils/imageService';

const categories = [
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function AddItemScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const insets = useSafeAreaInsets();

  // Test storage access when component mounts
  useEffect(() => {
    testStorageAccess();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!category) {
      newErrors.category = 'Category is required';
    }

    if (!condition) {
      newErrors.condition = 'Condition is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      setImageUploading(true);
      const { uri, error } = await pickImage();
      
      if (error) {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
        return;
      }
      
      if (uri) {
        setSelectedImage(uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Error picking image:', err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const { url, error } = await uploadImage(selectedImage);
        if (error) {
          console.error('Image upload error details:', error);
          Alert.alert(
            'Image Upload Failed', 
            `Failed to upload image: ${error.message || 'Unknown error'}. Please try again or continue without an image.`,
            [
              { text: 'Try Again', style: 'cancel' },
              { 
                text: 'Continue Without Image', 
                onPress: () => {
                  // Continue without image
                  submitWithoutImage();
                }
              }
            ]
          );
          setLoading(false);
          return;
        }
        imageUrl = url;
      }

      await submitWithData(imageUrl);
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error creating item:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitWithoutImage = async () => {
    await submitWithData(null);
  };

  const submitWithData = async (imageUrl) => {
    try {
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        condition,
        image_url: imageUrl,
      };

      const { data, error } = await createMarketplaceItem(itemData);

      if (error) {
        Alert.alert('Error', 'Failed to create item. Please try again.');
        console.error('Error creating item:', error);
      } else {
        Alert.alert('Success', 'Item posted successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error creating item:', err);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
    >
      <Text style={styles.title}>Add New Item</Text>

      <TextInput
        label="Title *"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        error={!!errors.title}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <TextInput
        label="Price ($) *"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        style={styles.input}
        error={!!errors.price}
      />
      {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

      <Text style={styles.sectionTitle}>Category *</Text>
      <View style={styles.buttonGrid}>
        {categories.map((cat) => (
          <Button
            key={cat.value}
            mode={category === cat.value ? 'contained' : 'outlined'}
            onPress={() => setCategory(cat.value)}
            style={styles.categoryButton}
            compact
          >
            {cat.label}
          </Button>
        ))}
      </View>
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

      <Text style={styles.sectionTitle}>Condition *</Text>
      <View style={styles.buttonGrid}>
        {conditions.map((cond) => (
          <Button
            key={cond.value}
            mode={condition === cond.value ? 'contained' : 'outlined'}
            onPress={() => setCondition(cond.value)}
            style={styles.categoryButton}
            compact
          >
            {cond.label}
          </Button>
        ))}
      </View>
      {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}

      <Text style={styles.sectionTitle}>Photo</Text>
      <View style={styles.imageSection}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <IconButton
              icon="close-circle"
              size={24}
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            />
          </View>
        ) : (
          <Button
            mode="outlined"
            onPress={handlePickImage}
            loading={imageUploading}
            disabled={imageUploading}
            style={styles.imagePickerButton}
            icon="camera"
          >
            {imageUploading ? 'Processing...' : 'Add Photo'}
          </Button>
        )}
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
        labelStyle={styles.submitButtonText}
        disabled={loading}
      >
        Post Item
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    marginBottom: 8,
    marginRight: 8,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#f00',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  imagePickerButton: {
    marginBottom: 8,
  },
});