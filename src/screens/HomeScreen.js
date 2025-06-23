// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Searchbar, Card, FAB, Text } from 'react-native-paper';

const numCols = 2;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / numCols; // 16px margin on each side + spacing

const dummyData = [
  { id: '1', title: 'Textbook A', price: '$20', image: null },
  { id: '2', title: 'Lamp', price: '$15', image: null },
  { id: '3', title: 'Backpack', price: '$30', image: null },
  { id: '4', title: 'Desk Chair', price: '$45', image: null },
];

export default function HomeScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(dummyData);
  const firstName = route?.params?.firstName;

  const onSearchChange = query => {
    setSearch(query);
    setItems(
      dummyData.filter(i =>
        i.title.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>
          {firstName ? `Welcome, ${firstName}!` : 'Welcome to College Marketplace'}
        </Text>
        <Text style={styles.welcomeSubtitle}>Find great deals from fellow students</Text>
      </View>
      
      <Searchbar
        placeholder="Search"
        onChangeText={onSearchChange}
        value={search}
        style={styles.search}
      />

      <FlatList
        data={items}
        numColumns={numCols}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('Detail', { item })}
          >
            <Card.Cover
              source={
                item.image
                  ? { uri: item.image }
                  : require('../../assets/placeholder.png')
              }
              style={styles.cover}
            />
            <Card.Content>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: { margin: 8 },
  list: { paddingHorizontal: 8 },
  card: {
    width: CARD_WIDTH,
    margin: 4,
  },
  cover: {
    height: CARD_WIDTH,
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  header: {
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});