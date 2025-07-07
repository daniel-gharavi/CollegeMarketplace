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
} from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createOrGetConversation,
  sendMessage,
  getMessages,
  subscribeToMessages,
  markMessagesAsRead,
} from '../../utils/chatService';
import {
  scheduleMessageNotification,
  getUserPushToken,
  sendPushNotification,
} from '../../utils/notificationService';
import { supabase } from '../../utils/supabase';
import { useUser } from '../../contexts/UserContext';

const ChatScreen = ({ route }) => {
  const theme = useTheme();
  const {
    seller: sellerParam,
    item: itemParam,
    conversationId: convoIdParam,
  } = route.params || {};

  const [seller, setSeller] = useState(sellerParam || null);
  const [item, setItem] = useState(itemParam || null);
  const [conversationIdParam] = useState(convoIdParam || null);
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
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation || !currentUser) return;
    supabase
      .from('profiles')
      .update({ active_chat_id: conversation.id })
      .eq('id', currentUser.id)
      .then(() => {})
      .catch(err => console.log('Failed to set active_chat_id:', err));
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
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to chat');
        return;
      }

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
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationIdParam)
          .single();
        if (convErr || !conv) throw new Error('Failed to open conversation');
        conversationData = conv;
        const otherUserId = conv.buyer_id === currentUser.id ? conv.seller_id : conv.buyer_id;
        if (!seller) {
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', otherUserId)
            .single();
          if (otherProfile) setSeller(otherProfile);
        }
        if (!item && conv.item_id) {
          const { data: itemData } = await supabase
            .from('marketplace_items')
            .select('id, title')
            .eq('id', conv.item_id)
            .single();
          if (itemData) setItem(itemData);
        }
      } else {
        if (!seller) throw new Error('Invalid chat session. Please try again.');
        const { data: conv, error: convErr } = await createOrGetConversation(
          seller.id,
          item?.id,
          currentUser
        );
        if (convErr) throw convErr;
        conversationData = conv;
      }

      setConversation(conversationData);
      const { data: messagesData, error: messagesError } = await getMessages(conversationData.id);
      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
      await markMessagesAsRead(conversationData.id, currentUser);
      subscriptionRef.current = subscribeToMessages(conversationData.id, (newMessage) => {
        handleNewMessage(newMessage, currentUser);
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = async (newMessage, currentUser) => {
    setMessages(prev => {
      if (prev.some(msg => msg.id === newMessage.id)) return prev;
      const filteredPrev = prev.filter(msg =>
        !(msg.id.startsWith('temp_') && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id)
      );
      return [...filteredPrev, newMessage];
    });

    if (newMessage.sender_id !== currentUser.id) {
      await markMessagesAsRead(conversation.id, currentUser);
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

    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data: messageData, error } = await sendMessage(conversation.id, messageText, currentUser);
      if (error) throw error;
      if (messageData) {
        setMessages(prev => prev.map(msg => (msg.id === optimisticMessage.id ? messageData : msg)));
      }

      const otherUserId = seller.id;
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('active_chat_id, first_name')
        .eq('id', otherUserId)
        .single();
      if (otherProfile?.active_chat_id === conversation.id) return;

      const { token: pushToken } = await getUserPushToken(otherUserId);
      if (pushToken) {
        const senderName = currentUserName || 'Someone';
        await sendPushNotification(pushToken, `${senderName} texted you`, messageText, {
          type: 'message',
          conversationId: conversation.id,
          senderName,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
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
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.sellerMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.sellerBubble, { backgroundColor: isUser ? theme.colors.primary : theme.colors.surface }]}>
          <Text style={[styles.messageText, { color: theme.colors.text }]}>
            {item.content?.trim()}
          </Text>
          <Text style={[styles.timestamp, { color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.colors.placeholder }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {seller?.first_name ? `${seller.first_name} ${seller.last_name || ''}` : 'Seller'}
          </Text>
          {item && (
            <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>About: {item.title}</Text>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
                Start the conversation! Say hello to {seller?.first_name || 'the seller'}.
              </Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            editable={!sending}
            placeholderTextColor={theme.colors.placeholder}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: (inputText.trim() && !sending) ? theme.colors.primary : theme.colors.background }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <IconButton
                icon="send"
                size={20}
                iconColor={(inputText.trim() && !sending) ? '#fff' : theme.colors.placeholder}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a4466',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
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
    maxWidth: '85%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  sellerBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#3a4466',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
  },
});

export default ChatScreen;