// src/screens/ItemDetailScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Chip } from 'react-native-paper';
import ContactSellerBottomSheet from '../components/ContactSellerBottomSheet';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const [contactModalVisible, setContactModalVisible] = useState(false);
  
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatCondition = (condition) => {
    return condition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  };

  const formatCategory = (category) => {
    return category?.replace(/\b\w/g, l => l.toUpperCase()) || '';
  };

  const handleContactSeller = () => {
    console.log('Contact Seller button pressed!');
    console.log('Setting contactModalVisible to true');
    console.log('Seller data:', item?.profiles);
    setContactModalVisible(true);
  };

  const handleCloseContactModal = () => {
    setContactModalVisible(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Card.Cover
            source={
              item?.image_url && item.image_url.trim() !== ''
                ? { uri: item.image_url }
                : require('../../assets/placeholder.png')
            }
            style={styles.cover}
            onError={(error) => {
              console.log('Image load error in detail screen:', item?.id, 'URL:', item?.image_url);
            }}
          />
        </Card>
        
        <View style={styles.info}>
          <Title style={styles.title}>{item?.title ?? 'Item Title'}</Title>
          <Text style={styles.price}>{formatPrice(item?.price ?? 0)}</Text>
          
          <View style={styles.chipContainer}>
            {item?.category && (
              <Chip style={styles.chip} textStyle={styles.chipText}>
                {formatCategory(item.category)}
              </Chip>
            )}
            {item?.condition && (
              <Chip style={styles.chip} textStyle={styles.chipText}>
                {formatCondition(item.condition)}
              </Chip>
            )}
          </View>

          {item?.description && (
            <Paragraph style={styles.desc}>
              {item.description}
            </Paragraph>
          )}

          {item?.profiles && (
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Seller:</Text>
              <Text style={styles.sellerName}>
                {item.profiles.first_name} {item.profiles.last_name}
              </Text>
            </View>
          )}

          {item?.created_at && (
            <Text style={styles.dateText}>
              Posted on {new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <Button
          mode="contained"
          onPress={handleContactSeller}
          style={styles.button}
          labelStyle={styles.buttonText}
          icon="message"
        >
          Contact Seller
        </Button>
      </ScrollView>

      <ContactSellerBottomSheet 
        visible={contactModalVisible}
        onClose={handleCloseContactModal}
        seller={item?.profiles}
      />
    </>
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
  title: {
    marginBottom: 8,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sellerInfo: {
    marginTop: 12,
  },
  sellerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sellerName: {
    fontSize: 14,
  },
  dateText: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
  },
});