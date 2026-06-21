import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
  require('react-native-screens').enableScreens();
}

import { AppProvider, useApp } from './src/context/AppContext';
import { C } from './src/constants/colors';

import OnboardingScreen      from './src/screens/OnboardingScreen';
import HomeScreen            from './src/screens/HomeScreen';
import JournalScreen         from './src/screens/JournalScreen';
import MoodCheckInScreen     from './src/screens/MoodCheckInScreen';
import SprintScreen          from './src/screens/SprintScreen';
import HobbiesScreen         from './src/screens/HobbiesScreen';
import ScreenAwarenessScreen from './src/screens/ScreenAwarenessScreen';
import BuddyScreen           from './src/screens/BuddyScreen';
import BloomChatScreen       from './src/screens/BloomChatScreen';
import GoalsScreen           from './src/screens/GoalsScreen';
import SettingsScreen        from './src/screens/SettingsScreen';
import IdeaBankScreen        from './src/screens/IdeaBankScreen';

const RootStack   = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const GrowStackNav = createNativeStackNavigator();
const BuddyStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🌸</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.forest, marginBottom: 12 }}>Something went wrong</Text>
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
        color: focused ? C.forest : C.muted,
      }}>{label}</Text>
    </View>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home"        component={HomeScreen} />
      <HomeStackNav.Screen name="Journal"     component={JournalScreen} />
      <HomeStackNav.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
      <HomeStackNav.Screen name="IdeaBank"    component={IdeaBankScreen} />
      <HomeStackNav.Screen
        name="Sprint"
        component={SprintScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </HomeStackNav.Navigator>
  );
}

function GrowStack() {
  return (
    <GrowStackNav.Navigator screenOptions={{ headerShown: false }}>
      <GrowStackNav.Screen name="HobbyGarden"     component={HobbiesScreen} />
      <GrowStackNav.Screen name="ScreenAwareness" component={ScreenAwarenessScreen} />
    </GrowStackNav.Navigator>
  );
}

function BuddyStack() {
  return (
    <BuddyStackNav.Navigator screenOptions={{ headerShown: false }}>
      <BuddyStackNav.Screen name="BuddyMain" component={BuddyScreen} />
      <BuddyStackNav.Screen name="BloomChat" component={BloomChatScreen} />
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Today" focused={focused} /> }}
      />
      <Tab.Screen
        name="GrowTab"
        component={GrowStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🌱" label="Grow" focused={focused} /> }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🌟" label="Growth" focused={focused} /> }}
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
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 56 }}>🌸</Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color: C.forest, marginTop: 14 }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Gentle guidance. Real progress.</Text>
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
