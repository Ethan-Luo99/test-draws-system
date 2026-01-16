import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import DrawsScreen from './screens/DrawsScreen';
import CreateDrawScreen from './screens/CreateDrawScreen';
import DrawDetailsScreen from './screens/DrawDetailsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Draws"
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Draws" 
          component={DrawsScreen} 
          options={{ title: 'Restaurant Dashboard' }}
        />
        <Stack.Screen 
          name="CreateDraw" 
          component={CreateDrawScreen} 
          options={{ title: 'Create New Draw' }}
        />
        <Stack.Screen 
          name="DrawDetails" 
          component={DrawDetailsScreen} 
          options={{ title: 'Draw Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
