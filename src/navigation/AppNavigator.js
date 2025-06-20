import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}