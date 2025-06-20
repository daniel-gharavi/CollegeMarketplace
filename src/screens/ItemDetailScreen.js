import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ItemDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Detail Screen</Text>
      <Text>Details about the item will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 8 },
});