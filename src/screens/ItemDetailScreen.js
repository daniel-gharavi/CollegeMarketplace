// src/screens/ItemDetailScreen.js
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Cover
          source={
            item?.image
              ? { uri: item.image }
              : require('../../assets/placeholder.png')
          }
          style={styles.cover}
        />
      </Card>
      <View style={styles.info}>
        <Title>{item?.title ?? 'Item Title'}</Title>
        <Paragraph style={styles.price}>{item?.price ?? '$0'}</Paragraph>
        <Paragraph style={styles.desc}>
          {item?.description ?? 'No description available.'}
        </Paragraph>
      </View>
      <Button
        mode="contained"
        onPress={() => {/* handle contact */}}
        style={styles.button}
      >
        Contact Seller
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  cover: {
    height: 200,
    borderRadius: 8,
  },
  info: {
    marginTop: 16,
  },
  price: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  desc: {
    marginTop: 12,
    fontSize: 14,
    color: '#444',
  },
  button: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 8,
  },
});