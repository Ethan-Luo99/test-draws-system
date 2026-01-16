// mobile-app/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import { useAuth } from '../context/AuthContext';

// Auth Stack Navigator
const AuthStack = createStackNavigator();
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

import DrawDetailsScreen from '../screens/DrawDetailsScreen';

// Main Stack Navigator inside Tab (to handle navigation from list to details)
const HomeStack = createStackNavigator();
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="DrawsList" 
        component={HomeScreen} 
        options={{ 
          title: 'Draws / Tirages',
          headerStyle: { backgroundColor: '#3498db' },
          headerTintColor: '#fff',
        }}
      />
      <HomeStack.Screen 
        name="DrawDetails" 
        component={DrawDetailsScreen} 
        options={{ 
          title: 'Details / Détails',
          headerStyle: { backgroundColor: '#3498db' },
          headerTintColor: '#fff',
        }}
      />
    </HomeStack.Navigator>
  );
};

// Main Tab Navigator
const MainTab = createBottomTabNavigator();
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hide tab header because stack has its own
        tabBarLabel: ({ focused }) => {
          // ... (keep existing label logic)
          let label: string;
          switch (route.name) {
            case 'HomeTab':
              label = 'Draws / Tirages';
              break;
            case 'Profile':
              label = 'Profile / Profil';
              break;
            default:
              label = route.name;
          }
          return (
            <Text style={{ 
              color: focused ? '#3498db' : '#7f8c8d',
              fontSize: 12,
              fontWeight: focused ? 'bold' : 'normal',
            }}>
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
      })}
    >
      <MainTab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator}
        options={{
          title: 'Draws / Tirages',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile / Profil',
          headerShown: true, // Profile doesn't have a stack, so show header
          headerStyle: { backgroundColor: '#3498db' },
          headerTintColor: '#fff',
        }}
      />
    </MainTab.Navigator>
  );
};

// Profile Screen (simple placeholder)
const ProfileScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, color: '#2c3e50' }}>
        Profile / Profil
      </Text>
    </View>
  );
};

// Main App Navigator
const AppStack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    // Loading screen / Écran de chargement
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading... / Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is authenticated / Utilisateur authentifié
          <AppStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          // User is not authenticated / Utilisateur non authentifié
          <AppStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
