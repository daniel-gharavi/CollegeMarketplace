import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  AppState,
  Dimensions
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  createOrGetConversation, 
  sendMessage, 
  getMessages, 
  subscribeToMessages,
  markMessagesAsRead,
  getUserPushToken,
  sendPushNotification
} from '../../utils/chatService';
import { 
  scheduleMessageNotification,
  getUserPushToken as getNotificationToken,
  sendPushNotification as sendNotificationToUser
} from '../../utils/notificationService';
import { supabase } from '../../utils/supabase';
import { useUser } from '../../contexts/UserContext';

const { width: screenWidth } = Dimensions.get('window');

const ChatScreen = ({ route }) => {
  // Can arrive via two paths:
  // 1. Inside app – navigate('Chat', { seller, item })
  // 2. From push notification – navigate('Chat', { conversationId })
  const {
    seller: sellerParam,
    item: itemParam,
    conversationId: convoIdParam,
  } = route.params || {};

  const [seller, setSeller] = useState(sellerParam || null);
  const [item, setItem] = useState(itemParam || null);
  const [conversationIdParam] = useState(convoIdParam || null); // constant
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user: currentUser } = useUser();
  const [currentUserName, setCurrentUserName] = useState('');
  const [appState, setAppState] = useState(AppState.currentState);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    initializeChat();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', setAppState);
    
    return () => {
      // Cleanup subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0) {
      // Use multiple attempts to ensure scroll works
      const scrollToEnd = () => {
        flatListRef.current?.scrollToEnd({ animated: false });
      };
      
      // Immediate scroll
      scrollToEnd();
      
      // Delayed scroll to handle any layout changes
      setTimeout(scrollToEnd, 50);
      setTimeout(scrollToEnd, 200);
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation || !currentUser) return;

    // Mark as active
    supabase
      .from('profiles')
      .update({ active_chat_id: conversation.id })
      .eq('id', currentUser.id)
      .then(() => {})
      .catch(err => console.log('Failed to set active_chat_id:', err));

    // On unmount, clear the active chat id
    return () => {
      supabase
        .from('profiles')
        .update({ active_chat_id: null })
        .eq('id', currentUser.id)
        .then(() => {})
        .catch(err => console.log('Failed to clear active_chat_id:', err));
    };
  }, [conversation, currentUser]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to chat');
        return;
      }

      // Fetch profile info to get first_name for notifications
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', currentUser.id)
        .single();
      if (profileData?.first_name) {
        setCurrentUserName(profileData.first_name);
      }

      let conversationData;

      if (conversationIdParam) {
        // Open existing conversation from notification
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationIdParam)
          .single();

        if (convErr || !conv) {
          console.error('Conversation fetch error:', convErr);
          Alert.alert('Error', 'Failed to open conversation');
          return;
        }

        conversationData = conv;

        // Figure out who the other user is
        const otherUserId = conv.buyer_id === currentUser.id ? conv.seller_id : conv.buyer_id;

        // Fetch other user's basic profile if not already provided
        if (!seller) {
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', otherUserId)
            .single();
          if (otherProfile) setSeller(otherProfile);
        }

        // Fetch item info if needed
        if (!item && conv.item_id) {
          const { data: itemData } = await supabase
            .from('marketplace_items')
            .select('id, title')
            .eq('id', conv.item_id)
            .single();
          if (itemData) setItem(itemData);
        }
      } else {
        // Create or get conversation normally
        if (!seller) {
          Alert.alert('Error', 'Invalid chat session. Please try again.');
          return;
        }
        const { data: conv, error: convErr } = await createOrGetConversation(
          seller.id,
          item?.id,
          currentUser
        );

        if (convErr) {
          console.error('Conversation error:', convErr);
          Alert.alert('Error', 'Failed to start conversation');
          return;
        }
        conversationData = conv;
      }

      setConversation(conversationData);

      // Load existing messages
      const { data: messagesData, error: messagesError } = await getMessages(conversationData.id);
      
      if (messagesError) {
        console.error('Messages error:', messagesError);
        Alert.alert('Error', 'Failed to load messages');
        return;
      }

      setMessages(messagesData || []);

      // Mark messages as read
      await markMessagesAsRead(conversationData.id, currentUser);

      // Subscribe to real-time messages
      subscriptionRef.current = subscribeToMessages(conversationData.id, (newMessage) => {
        console.log('Received real-time message:', newMessage);
        handleNewMessage(newMessage, currentUser);
      });

    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = async (newMessage, currentUser) => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        console.log('Message already exists, skipping');
        return prev;
      }
      
      // Filter out any temporary messages with the same content and sender
      const filteredPrev = prev.filter(msg => 
        !(msg.id.startsWith('temp_') && 
          msg.content === newMessage.content && 
          msg.sender_id === newMessage.sender_id)
      );
      
      console.log('Adding new message to list');
      return [...filteredPrev, newMessage];
    });

    // Show notification if message is from another user and app is in background/inactive
    if (newMessage.sender_id !== currentUser.id) {
      // Mark as read
      await markMessagesAsRead(conversation.id, currentUser);
      
      // Show local notification if app is in background
      if (appState !== 'active') {
        const senderName = seller?.first_name ? `${seller.first_name} ${seller.last_name || ''}` : 'Someone';
        await scheduleMessageNotification(
          senderName,
          newMessage.content,
          conversation.id
        );
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !conversation || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: messageText,
      created_at: new Date().toISOString(),
    };

    // Add message immediately to UI
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data: messageData, error } = await sendMessage(conversation.id, messageText, currentUser);
      
      if (error) {
        console.error('Send message error:', error);
        Alert.alert('Error', 'Failed to send message');
        setInputText(messageText); // Restore input text
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        return;
      }

      // Replace optimistic message with real message
      if (messageData) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? messageData : msg
        ));
      }

      // Send push notification to the other user
      try {
        const otherUserId = seller.id;
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('active_chat_id, first_name')
          .eq('id', otherUserId)
          .single();

        if (otherProfile?.active_chat_id === conversation.id) {
          // The other user is currently in this chat – don't send a notification
          return;
        }

        const { token: pushToken } = await getNotificationToken(otherUserId);
        
        if (pushToken) {
          const senderName = currentUserName || 'Someone';
          await sendNotificationToUser(
            pushToken,
            `${senderName} texted you`,
            messageText,
            {
              type: 'message',
              conversationId: conversation.id,
              senderName
            }
          );
        }
      } catch (notificationError) {
        console.log('Failed to send push notification:', notificationError);
        // Don't show error to user for notification failures
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText); // Restore input text
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender_id === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.sellerMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.sellerBubble
        ]}>
          <View style={styles.textContainer}>
            <Text 
              numberOfLines={0}
              ellipsizeMode="clip"
              style={[
                styles.messageText,
                isUser ? styles.userText : styles.sellerText
              ]}>
              {item.content?.trim()}
            </Text>
          </View>
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.sellerTimestamp
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {seller?.first_name ? `${seller.first_name} ${seller.last_name || ''}` : 'Seller'}
          </Text>
          {item && (
            <Text style={styles.headerSubtitle}>About: {item.title}</Text>
          )}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          onLayout={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Start the conversation! Say hello to {seller?.first_name || 'the seller'}.
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (inputText.trim() && !sending) ? styles.sendButtonActive : null
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <IconButton 
                icon="send" 
                size={20} 
                iconColor={(inputText.trim() && !sending) ? '#fff' : '#ccc'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
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
  messageContainer: {
    marginVertical: 4,
    width: '100%',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  sellerMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    flexDirection: 'column',
    alignSelf: 'auto',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  sellerBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  textContainer: {
    flex: 0,
    flexShrink: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    flexWrap: 'wrap',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  userText: {
    color: '#fff',
    fontWeight: 'normal',
  },
  sellerText: {
    color: '#333',
    fontWeight: 'normal',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sellerTimestamp: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
});

export default ChatScreen; 