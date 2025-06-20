// src/screens/AddItemScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

const categories = ['Books', 'Electronics', 'Furniture', 'Other'];

export default function AddItemScreen({ navigation }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (res.granted) {
      let result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
      if (!result.cancelled) setImage(result.uri);
    }
  };

  const onSave = () => {
    // validate & save logic
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Description"
        value={desc}
        onChangeText={setDesc}
        multiline
        style={styles.input}
      />
      <TextInput
        label="Category"
        value={category}
        onFocus={() => {/* open a menu or picker */}}
        style={styles.input}
      />
      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.input}
      >
        {image ? 'Change Photo' : 'Pick a Photo'}
      </Button>
      {image && <Image source={{ uri: image }} style={styles.preview} />}
      <Button
        mode="contained"
        onPress={onSave}
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        disabled={!title || !price}
      >
        Save
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 12 },
  preview: {
    width: '100%',
    height: 200,
    marginBottom: 12,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});