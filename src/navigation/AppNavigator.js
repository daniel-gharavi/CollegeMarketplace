import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import { supabase } from '../../utils/supabase';

const Stack = createStackNavigator();

// 🚨 TESTING MODE CONFIGURATION 🚨
// FOR PRODUCTION: Change TESTING_MODE to false
// FOR TESTING: Change TESTING_MODE to true
const TESTING_MODE = true;
const TEST_USER_ID = '7e56eb93-c1e1-4bf6-b48f-7e5efe56f5b0';

// ✅ Easy Production Switch:
// 1. Set TESTING_MODE = false
// 2. That's it! App will start with Login screen

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      if (session?.user) {
        getUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserProfile = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine initial route based on authentication state or testing mode
  const getInitialRouteName = () => {
    if (TESTING_MODE) {
      return "Home";
    }
    return session ? "Home" : "Login";
  };

  // Get initial params for Home screen
  const getHomeInitialParams = () => {
    if (TESTING_MODE) {
      return { firstName: 'Test User', userId: TEST_USER_ID };
    }
    return session ? { 
      firstName: userProfile?.first_name, 
      userId: session.user.id 
    } : undefined;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerTitleStyle: {
            fontSize: 18,
          },
          headerStyle: {
            elevation: 4,
            shadowOpacity: 0.2,
          }
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Marketplace' }}
          initialParams={getHomeInitialParams()}
        />
        <Stack.Screen 
          name="Detail" 
          component={ItemDetailScreen} 
          options={{ title: 'Item Details' }} 
        />
        <Stack.Screen 
          name="Add" 
          component={AddItemScreen} 
          options={{ title: 'Post an Item' }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: 'Sign Up' }} 
        />
        <Stack.Screen 
          name="OTPVerification" 
          component={OTPVerificationScreen} 
          options={{ title: 'Verify Email' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}