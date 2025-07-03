import React, { useState, useEffect } from 'react';
import {
  createStackNavigator,
  CardStyleInterpolators,   // ← restored import
} from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditItemScreen from '../screens/EditItemScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';

import { useUser } from '../../contexts/UserContext';
import { useTheme } from 'react-native-paper';

import {
  initializeNotifications,
  setupNotificationListeners,
  removeNotificationListeners,
} from '../../utils/notificationService';

const Stack = createStackNavigator();

function AppNavigatorContent() {
  const theme   = useTheme();
  const nav     = useNavigation();
  const { user, loading } = useUser();
  const [notificationListeners, setNotificationListeners] = useState(null);

  /* ───────────────────────────────── notifications ── */
  useEffect(() => {
    if (user) initNotifications(); else cleanup();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const initNotifications = async () => {
    try {
      const result = await initializeNotifications();
      if (result.success) {
        const listeners = setupNotificationListeners(nav);
        setNotificationListeners(listeners);
      } else {
        console.log('Notification init failed:', result.error);
      }
    } catch (err) {
      console.error('Notification init error:', err);
    }
  };

  const cleanup = () => {
    if (notificationListeners) {
      removeNotificationListeners(notificationListeners);
      setNotificationListeners(null);
    }
  };

  /* ───────────────────────────── loading state ── */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /* ───────────────────────────── navigator ── */
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // keeps iOS-style slide
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home"     component={HomeScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
          <Stack.Screen name="Chat"     component={ChatScreen}     options={{ title: 'Chat' }} />
          <Stack.Screen name="Detail"   component={ItemDetailScreen} />
          <Stack.Screen name="Add"      component={AddItemScreen}   options={{ title: 'Add Item' }} />

          {/* your own profile */}
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />

          {/* seller profile reached from ItemDetailScreen */}
          <Stack.Screen
            name="UserProfile"
            component={ProfileScreen}
            options={{ title: 'Seller Profile' }}
          />

          <Stack.Screen name="EditItem" component={EditItemScreen} options={{ title: 'Edit Item' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"          component={LoginScreen}  options={{ headerShown: false }} />
          <Stack.Screen name="Signup"         component={SignupScreen} options={{ title: 'Sign Up' }} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ title: 'Verify Email' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return <AppNavigatorContent />;
}