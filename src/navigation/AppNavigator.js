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

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
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