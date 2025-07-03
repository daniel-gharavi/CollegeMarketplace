import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  Card,
  Text,
  Divider,
  Avatar,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContactSellerBottomSheet from '../components/ContactSellerBottomSheet';
import { useUser } from '../../contexts/UserContext';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
};

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showContactSheet, setShowContactSheet] = useState(false);
  const { user: currentUser } = useUser();

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text>No item data.</Text>
      </View>
    );
  }

  const isOwnListing = currentUser && item.seller_id === currentUser.id;
  const seller = item.profiles;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: item.title || 'Details' });
  }, [navigation, item]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card.Cover
          source={
            item.image_url
              ? { uri: item.image_url }
              : require('../../assets/placeholder.png')
          }
          style={styles.cover}
        />

        <View style={styles.info}>
          <Text style={[styles.category, { color: theme.colors.primary }]}>
            {item.category?.toUpperCase() || 'GENERAL'}
          </Text>
          <Title style={styles.title}>{item.title}</Title>
          <Title style={styles.price}>${item.price}</Title>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.desc}>
            {item.description || 'No description'}
          </Paragraph>
        </View>

        <Divider style={styles.divider} />

        {seller && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Seller</Title>
            <Pressable
              style={styles.sellerRow}
              hitSlop={8}
              onPress={() => navigation.navigate('Profile', { userId: seller.id })}
            >
              <Avatar.Text size={48} label={seller.first_name?.[0] || 'U'} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.sellerName}>
                  {seller.first_name} {seller.last_name}
                </Text>
                <Text style={styles.sellerSub}>
                  Member since {formatDate(seller.created_at)}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!isOwnListing && (
        <View
          style={[
            styles.buttonWrap,
            { paddingBottom: insets.bottom + 8, backgroundColor: theme.colors.surface },
          ]}
        >
          <Button
            mode="contained"
            onPress={() => setShowContactSheet(true)}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            Contact Seller
          </Button>
        </View>
      )}

      <ContactSellerBottomSheet
        visible={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        seller={seller}
        item={item}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  cover: { borderRadius: 0 },
  info: { padding: 16 },
  category: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold' },
  price: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#EAEBEE' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 16, lineHeight: 24 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
  sellerName: { fontSize: 16, fontWeight: '600' },
  sellerSub: { fontSize: 14, color: '#65676B' },
  buttonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EAEBEE',
  },
  button: { borderRadius: 8, paddingVertical: 8 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});