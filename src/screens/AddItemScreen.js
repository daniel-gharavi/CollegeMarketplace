import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddItemScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Item Screen</Text>
      <Text>Form to add a new item will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 8 },
});