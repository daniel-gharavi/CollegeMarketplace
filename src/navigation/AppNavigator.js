import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';

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
  const initialRouteName = TESTING_MODE ? "Home" : "Login";

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRouteName}
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
          initialParams={TESTING_MODE ? { firstName: 'Test User', userId: TEST_USER_ID } : undefined}
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