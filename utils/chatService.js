import { supabase } from './supabase';

// Create or get existing conversation between two users
export const createOrGetConversation = async (sellerId, itemId = null, currentUser = null) => {
  try {
    let user = currentUser;
    if (!user) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }
    if (!user) throw new Error('User not authenticated');

    // Check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${user.id})`)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingConversation) {
      return { data: existingConversation, error: null };
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([
        {
          buyer_id: user.id,
          seller_id: sellerId,
          item_id: itemId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (createError) throw createError;
    return { data: newConversation, error: null };
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    return { data: null, error };
  }
};

// Send a message in a conversation
export const sendMessage = async (conversationId, messageText, currentUser = null) => {
  try {
    let user = currentUser;
    if (!user) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }
    if (!user) throw new Error('User not authenticated');

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageText.trim(),
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last message timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { data: message, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }
};

// Get messages for a conversation
export const getMessages = async (conversationId) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: messages, error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error };
  }
};

// Get all conversations for current user
export const getUserConversations = async (currentUser = null) => {
  try {
    let user = currentUser;
    if (!user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      user = sessionData?.session?.user;
    }
    if (!user) throw new Error('User not authenticated');

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:profiles!buyer_id (
          id,
          first_name,
          last_name
        ),
        seller:profiles!seller_id (
          id,
          first_name,
          last_name
        ),
        item:marketplace_items!item_id (
          id,
          title,
          image_url
        ),
        latest_message:messages (
          content,
          created_at,
          sender_id
        )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' });

    if (error) throw error;

    const processedConversations = (conversations || []).map(conv => {
      const latestMessage = conv.latest_message?.[0] || null;
      const otherUser = conv.buyer_id === user.id ? conv.seller : conv.buyer;
      return {
        ...conv,
        latest_message: latestMessage,
        other_user: otherUser,
      };
    });

    return { data: processedConversations, error: null };
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return { data: null, error };
  }
};

// Subscribe to real-time messages for a conversation
export const subscribeToMessages = (conversationId, callback) => {
  console.log('Setting up real-time subscription for conversation:', conversationId);
  
  const subscription = supabase
    .channel(`messages_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('Real-time message received:', payload.new);
        // Return the message data directly from the payload
        callback(payload.new);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  return subscription;
};

// Subscribe to real-time conversation updates
export const subscribeToConversations = async (callback, currentUser = null) => {
  let user = currentUser;
  if (!user) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }
  if (!user) return null;
  return _subscribe(user.id, callback);
};

const _subscribe = (userId, callback) => {
  const subscription = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        if (payload.new?.buyer_id === userId || payload.new?.seller_id === userId) {
          callback(payload);
        }
      }
    )
    .subscribe();

  return subscription;
};

// Mark messages as read (optional feature)
export const markMessagesAsRead = async (conversationId, currentUser = null) => {
  try {
    let user = currentUser;
    if (!user) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

// Get user's push token by ID
export const getUserPushToken = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { token: data?.push_token, error: null };
  } catch (error) {
    console.error('Error getting user push token:', error);
    return { token: null, error };
  }
};

// Send push notification to user
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}; 