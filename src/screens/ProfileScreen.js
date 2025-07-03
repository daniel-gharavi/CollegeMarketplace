import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Title,
  useTheme,
  Avatar,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  getUserItems,
  deleteMarketplaceItem,
} from '../../utils/marketplaceService.js';
import { deleteImage } from '../../utils/imageService.js';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';

const { width } = Dimensions.get('window');
const SPACING = 16;
const CARD_WIDTH = (width - SPACING * 3) / 2;

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
};

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const viewedUserId = route?.params?.userId;
  const theme = useTheme();

  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const { user: authUserCtx } = useUser();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const own = !viewedUserId || viewedUserId === authUser?.id;
    setIsOwnProfile(own);

    const targetId = viewedUserId || authUser?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, created_at')
      .eq('id', targetId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to load profile.');
      setLoading(false);
      return;
    }

    setProfileData({
      id: targetId,
      user_metadata: {
        first_name: profile.first_name,
        last_name: profile.last_name,
      },
      created_at: profile.created_at,
    });

    if (own) {
      setAvatarUrl(authUser?.user_metadata.avatar_url || null);
    } else {
      setAvatarUrl(null);
    }
  }, [viewedUserId]);

  const loadUserItems = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      let data, error;
      if (isOwnProfile) {
        ({ data, error } = await getUserItems());
      } else {
        ({ data, error } = await supabase
          .from('marketplace_items')
          .select(
            `
            *,
            profiles:seller_id (id, first_name, last_name, email, phone_number, created_at)
          `
          )
          .eq('seller_id', viewedUserId));
      }

      if (error) throw error;
      setUserItems(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load items.');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    if (profileData) {
      loadUserItems();
    }
  }, [profileData, isOwnProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserItems(true);
    setRefreshing(false);
  };

  const handleDelete = (item) =>
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) },
    ]);

  const performDelete = async (item) => {
    try {
      if (item.image_url) await deleteImage(item.image_url);
      await deleteMarketplaceItem(item.id);
      Alert.alert('Success', 'Item deleted.');
      await loadUserItems(true);
    } catch (err) {
      Alert.alert('Error', `Failed to delete item: ${err.message}`);
    }
  };

  const handleEdit = (item) => navigation.navigate('EditItem', { item });

  const pickAvatar = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (result.cancelled) return;

    const fileName = `${profileData.id}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, await fetch(result.uri).then((r) => r.blob()), {
        upsert: true,
      });

    if (uploadError) {
      Alert.alert('Error', uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName);

    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
  };

  const renderItem = ({ item }) => {
    const openDetail = () => navigation.navigate('Detail', { item });

    return (
      <Pressable onPress={openDetail} style={styles.cardContainer}>
        <Card.Cover
          source={
            item.image_url
              ? { uri: item.image_url }
              : require('../../assets/placeholder.png')
          }
          style={styles.cover}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.price, { color: theme.colors.text }]}>
            ${item.price}
          </Text>
        </View>

        {isOwnProfile && (
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              compact
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              style={styles.cardButton}
              buttonColor="#EAEAEA"
              textColor="#000"
              labelStyle={styles.buttonLabel}
            >
              Edit
            </Button>
            <Button
              mode="contained"
              compact
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
              buttonColor={theme.colors.error}
              style={styles.cardButton}
              labelStyle={styles.buttonLabel}
            >
              Delete
            </Button>
          </View>
        )}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={userItems}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {profileData && (
              <View style={styles.profileHeader}>
                <Pressable
                  onPress={isOwnProfile ? pickAvatar : undefined}
                  style={styles.avatarContainer}
                >
                  {avatarUrl ? (
                    <Avatar.Image size={80} source={{ uri: avatarUrl }} />
                  ) : (
                    <Avatar.Icon size={80} icon="account" />
                  )}
                  {isOwnProfile && (
                    <View style={styles.editOverlay}>
                      <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <Text style={[styles.username, { color: theme.colors.text }]}>
                  {`${profileData.user_metadata.first_name || ''} ${
                    profileData.user_metadata.last_name || ''
                  }`.trim() || 'No Name'}
                </Text>
                <Text style={[styles.memberSince, { color: theme.colors.text }]}>
                  Member since {formatDate(profileData.created_at)}
                </Text>
              </View>
            )}

            <Title style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isOwnProfile ? 'My Listings' : 'Listings'}
            </Title>
          </>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: theme.colors.text }}>
              {isOwnProfile
                ? "You haven't posted any items yet."
                : 'No listings.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: SPACING / 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardContainer: {
    width: CARD_WIDTH,
    margin: SPACING / 2,
  },
  cover: {
    height: 150,
    borderRadius: 8,
    backgroundColor: '#1A294B',
  },
  textContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  price: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  cardButton: {
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  buttonLabel: {
    fontSize: 12,
    marginVertical: 4,
    marginHorizontal: 0,
  },
  profileHeader: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 16 },
  username: { marginTop: 12, fontSize: 20, fontWeight: 'bold' },
  memberSince: { fontSize: 14, opacity: 0.7 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  avatarContainer: { position: 'relative' },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
});