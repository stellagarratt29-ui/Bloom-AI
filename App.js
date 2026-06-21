import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/context/AppContext';
import { C } from './src/constants/colors';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import SprintScreen     from './src/screens/SprintScreen';
import HobbiesScreen    from './src/screens/HobbiesScreen';
import BuddyScreen      from './src/screens/BuddyScreen';
import IdeaBankScreen   from './src/screens/IdeaBankScreen';
import GoalsScreen      from './src/screens/GoalsScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

enableScreens();

const RootStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const BuddyStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FAF8F4', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🌸</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D4A35', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', fontFamily: 'monospace' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10, marginTop: 2, fontWeight: focused ? '700' : '500',
        color: focused ? C.sage : C.muted,
      }}>{label}</Text>
    </View>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home"     component={HomeScreen} />
      <HomeStackNav.Screen name="IdeaBank" component={IdeaBankScreen} />
      <HomeStackNav.Screen name="Sprint"   component={SprintScreen} options={{ presentation: 'fullScreenModal' }} />
    </HomeStackNav.Navigator>
  );
}

function BuddyStack() {
  return (
    <BuddyStackNav.Navigator screenOptions={{ headerShown: false }}>
      <BuddyStackNav.Screen name="BuddyMain" component={BuddyScreen} />
      <BuddyStackNav.Screen name="Settings"  component={SettingsScreen} />
    </BuddyStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" label="Goals" focused={focused} /> }}
      />
      <Tab.Screen
        name="Grow"
        component={HobbiesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🌱" label="Grow" focused={focused} /> }}
      />
      <Tab.Screen
        name="Buddy"
        component={BuddyStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🌿" label="Buddy" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F4', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 56 }}>🌸</Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#2D4A35', marginTop: 14 }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: '#8A9B8C', marginTop: 6 }}>Gentle guidance. Real progress.</Text>
    </View>
  );
}

function RootNavigator() {
  const { loaded, hasOnboarded, finishOnboarding } = useApp();

  if (!loaded) return <SplashScreen />;

  if (!hasOnboarded) {
    return <OnboardingScreen onFinish={finishOnboarding} />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
