import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  // Expo SDK 49+: `shouldShowAlert` is deprecated. Use `shouldShowBanner` / `shouldShowList` instead.
  // We show the banner (foreground heads-up) and also list it in the notification center.
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return { success: false, error: 'Permission denied' };
      }
      
      return { success: true, status: finalStatus };
    } else {
      console.log('Must use physical device for Push Notifications');
      return { success: false, error: 'Physical device required' };
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { success: false, error };
  }
};

// Get push notification token
export const getPushToken = async () => {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    console.log('Push token:', token.data);
    return { token: token.data, error: null };
  } catch (error) {
    console.error('Error getting push token:', error);
    return { token: null, error };
  }
};

// Save push token to user profile
export const savePushToken = async (token, currentUser = null) => {
  try {
    let user = currentUser;
    if (!user) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ 
        push_token: token
      })
      .eq('id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving push token:', error);
    return { success: false, error };
  }
};

// Initialize notifications (call this when app starts)
export const initializeNotifications = async () => {
  try {
    // Request permissions
    const permissionResult = await requestNotificationPermissions();
    if (!permissionResult.success) {
      return permissionResult;
    }

    // Get push token
    const tokenResult = await getPushToken();
    if (!tokenResult.token) {
      return { success: false, error: tokenResult.error };
    }

    // Save token to profile
    const saveResult = await savePushToken(tokenResult.token);
    if (!saveResult.success) {
      return saveResult;
    }

    console.log('Notifications initialized successfully');
    return { success: true, token: tokenResult.token };
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return { success: false, error };
  }
};

// Schedule local notification for new message
export const scheduleMessageNotification = async (senderName, messageContent, conversationId) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${senderName} texted you`,
        body: messageContent,
        data: { 
          type: 'message',
          conversationId,
          senderName 
        },
        sound: true,
      },
      trigger: null, // Show immediately
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error };
  }
};

// Handle notification response (when user taps notification)
export const handleNotificationResponse = (response, navigation) => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'message' && data.conversationId) {
    // Navigate to chat screen
    navigation.navigate('Chat', { 
      conversationId: data.conversationId,
      senderName: data.senderName 
    });
  }
};

// Set up notification listeners
export const setupNotificationListeners = (navigation) => {
  // Handle notification when app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle user tapping notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    handleNotificationResponse(response, navigation);
  });

  return {
    notificationListener,
    responseListener,
  };
};

// Clean up notification listeners
export const removeNotificationListeners = (listeners) => {
  if (listeners.notificationListener) {
    listeners.notificationListener.remove();
  }
  if (listeners.responseListener) {
    listeners.responseListener.remove();
  }
};

// Send push notification to user (for backend use)
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