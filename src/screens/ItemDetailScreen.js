import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card, Text, Divider, Avatar, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Set the header title dynamically to the item's title
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.title || 'Details',
    });
  }, [navigation, item]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* The image now has no curved edges */}
        <Card.Cover
            source={ item?.image_url ? { uri: item.image_url } : require('../../assets/placeholder.png') }
            style={styles.cover}
        />
        
        <View style={styles.infoSection}>
            <Text style={[styles.category, { color: theme.colors.primary }]}>
                {item.category?.toUpperCase() || 'GENERAL'}
            </Text>
            <Title style={styles.title}>{item?.title ?? 'Item Title'}</Title>
            <Title style={styles.price}>{`$${item?.price ?? '0'}`}</Title>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph style={styles.desc}>
                {item?.description || 'No description provided.'}
            </Paragraph>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
            <Title style={styles.sectionTitle}>Seller Information</Title>
            <View style={styles.sellerRow}>
                <Avatar.Text size={48} label={item.profiles.first_name?.[0] || 'U'} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.sellerName}>{`${item.profiles.first_name} ${item.profiles.last_name}`}</Text>
                    <Text style={styles.sellerSubtext}>Member since 2024</Text>
                </View>
            </View>
        </View>
      </ScrollView>
    
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 8, backgroundColor: theme.colors.surface }]}>
          <Button
              mode="contained"
              onPress={() => console.log('Message Seller')}
              style={styles.button}
              labelStyle={styles.buttonText}
          >
              Message Seller
          </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 }, // Add padding to ensure content is not hidden by the sticky button
  cover: { borderRadius: 0 }, // Remove rounded corners from the image
  infoSection: { padding: 16 },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  title: { fontSize: 26, fontWeight: 'bold' },
  price: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#EAEBEE' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 16, lineHeight: 24 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
  sellerName: { fontSize: 16, fontWeight: '600' },
  sellerSubtext: { fontSize: 14, color: '#65676B' },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EBEEF0',
  },
  button: { borderRadius: 8, paddingVertical: 8 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});