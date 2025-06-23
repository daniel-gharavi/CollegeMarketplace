// src/screens/ItemDetailScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Chip, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

  const getCategoryIcon = (category) => {
    const icons = {
      textbooks: 'book',
      electronics: 'devices',
      furniture: 'chair',
      clothing: 'checkroom',
      sports: 'sports-basketball',
      other: 'category'
    };
    return icons[category] || 'category';
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: '#4CAF50',
      like_new: '#8BC34A',
      good: '#FFC107',
      fair: '#FF9800',
      poor: '#F44336'
    };
    return colors[condition] || '#757575';
  };

  const getConditionIcon = (condition) => {
    const icons = {
      new: 'new-releases',
      like_new: 'star',
      good: 'thumb-up',
      fair: 'thumbs-up-down',
      poor: 'thumb-down'
    };
    return icons[condition] || 'help';
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
          
          {/* Enhanced Category and Condition Section */}
          <Surface style={styles.detailsSection} elevation={1}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            <Divider style={styles.sectionDivider} />
            
            <View style={styles.detailsGrid}>
              {item?.category && (
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Icon name={getCategoryIcon(item.category)} size={18} color="#1976D2" />
                    <Text style={styles.detailLabel}>Category</Text>
                  </View>
                  <Chip 
                    style={styles.categoryChip}
                    textStyle={styles.categoryChipText}
                    compact
                  >
                    {formatCategory(item.category)}
                  </Chip>
                </View>
              )}
              
              {item?.condition && (
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Icon 
                      name={getConditionIcon(item.condition)} 
                      size={18} 
                      color={getConditionColor(item.condition)} 
                    />
                    <Text style={styles.detailLabel}>Condition</Text>
                  </View>
                  <Chip 
                    style={[
                      styles.conditionChip, 
                      { backgroundColor: getConditionColor(item.condition) }
                    ]}
                    textStyle={styles.conditionChipText}
                    compact
                  >
                    {formatCondition(item.condition)}
                  </Chip>
                </View>
              )}
            </View>
          </Surface>

          {item?.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Divider style={styles.sectionDivider} />
              <Paragraph style={styles.desc}>
                {item.description}
              </Paragraph>
            </View>
          )}

          {item?.profiles && (
            <Surface style={styles.sellerSection} elevation={1}>
              <View style={styles.sellerHeader}>
                <Icon name="person" size={20} color="#1976D2" />
                <Text style={styles.sectionTitle}>Seller Information</Text>
              </View>
              <Divider style={styles.sectionDivider} />
              <Text style={styles.sellerName}>
                {item.profiles.first_name} {item.profiles.last_name}
              </Text>
              {item?.created_at && (
                <Text style={styles.dateText}>
                  Listed on {new Date(item.created_at).toLocaleDateString()}
                </Text>
              )}
            </Surface>
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
    fontSize: 22,
    lineHeight: 28,
  },
  price: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  sectionDivider: {
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  categoryChipText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 12,
  },
  conditionChip: {
    borderWidth: 0,
  },
  conditionChipText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: '#424242',
  },
  sellerSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#757575',
    fontStyle: 'italic',
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
});