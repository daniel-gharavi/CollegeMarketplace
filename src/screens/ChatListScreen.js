import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getUserConversations, subscribeToConversations } from '../../utils/chatService';
import { useUser } from '../../contexts/UserContext';

const ChatListScreen = ({ navigation }) => {
  const { user: currentUser } = useUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const subscriptionRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
      setupRealtimeSubscription();
      
      return () => {
        if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
          subscriptionRef.current.unsubscribe();
        }
      };
    }, [])
  );

  const setupRealtimeSubscription = async () => {
    const sub = await subscribeToConversations((payload) => {
      console.log('Conversation update received:', payload);
      loadConversations(); // Reload when update
    }, currentUser);
    subscriptionRef.current = sub;
  };

  const loadConversations = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data, error } = await getUserConversations(currentUser);
      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations(true);
    setRefreshing(false);
  };

  const handleConversationPress = (conversation) => {
    // Navigate to the specific chat with the other user's info
    const otherUser = conversation.other_user;
    const item = conversation.item;
    
    navigation.navigate('Chat', {
      seller: otherUser,
      item: item,
      conversationId: conversation.id
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }) => {
    const otherUser = item.other_user;
    const latestMessage = item.latest_message;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem} 
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {otherUser?.first_name?.charAt(0) || 'U'}
          </Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>
              {otherUser?.first_name ? `${otherUser.first_name} ${otherUser.last_name || ''}` : 'Unknown User'}
            </Text>
            {latestMessage && (
              <Text style={styles.timestamp}>
                {formatTime(latestMessage.created_at)}
              </Text>
            )}
          </View>
          
          {item.item && (
            <Text style={styles.itemTitle}>
              About: {item.item.title}
            </Text>
          )}
          
          {latestMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {latestMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        ItemSeparatorComponent={() => <Divider />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No conversations yet.{'\n'}
              Start chatting with sellers when you view their items!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  itemTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  noMessages: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChatListScreen; 