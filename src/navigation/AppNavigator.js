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
import ProfileScreen from '../screens/ProfileScreen';
import EditItemScreen from '../screens/EditItemScreen';
import { supabase } from '../../utils/supabase';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerTitleStyle: { fontSize: 18 },
          headerStyle: { elevation: 4, shadowOpacity: 0.2 }
        }}
      >
        {session && session.user ? (
           <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Marketplace' }}
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
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen 
              name="EditItem"
              component={EditItemScreen}
              options={{ title: 'Edit Item' }}
            />
           </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}