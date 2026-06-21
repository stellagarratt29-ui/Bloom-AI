import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text, View, Platform, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

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

const RootStack     = createNativeStackNavigator();
const HomeStackNav  = createNativeStackNavigator();
const GrowStackNav  = createNativeStackNavigator();
const BuddyStackNav = createNativeStackNavigator();
const Tab           = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'HomeTab', icon: 'home',        label: 'Today'  },
  { name: 'GrowTab', icon: 'sun',         label: 'Grow'   },
  { name: 'Goals',   icon: 'trending-up', label: 'Growth' },
  { name: 'Buddy',   icon: 'heart',       label: 'Buddy'  },
];

const SIDEBAR_W = 220;

function useLayout() {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return 'phone';
  if (width >= 1400) return 'desktop';
  if (width >= 600)  return 'tablet';
  return 'phone';
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
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

function TabIcon({ iconName, label, focused }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Feather name={iconName} size={22} color={focused ? C.forest : C.muted} />
      <Text style={{
        fontSize: 10, marginTop: 3, fontWeight: focused ? '700' : '500',
        color: focused ? C.forest : C.muted,
      }}>{label}</Text>
    </View>
  );
}

// Renders as a left sidebar on desktop, bottom bar on phone/tablet
function CustomTabBar({ state, navigation }) {
  const layout = useLayout();

  if (layout === 'desktop') {
    return (
      <View style={deskS.sidebar}>
        <View style={deskS.logoWrap}>
          <Text style={deskS.logoText}>Bloom</Text>
          <Text style={deskS.logoSub}>Gentle progress.</Text>
        </View>
        {TAB_ITEMS.map((item, index) => {
          const focused = state.index === index;
          return (
            <TouchableOpacity
              key={item.name}
              style={[deskS.navItem, focused && deskS.navItemActive]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={20} color={focused ? C.forest : C.muted} />
              <Text style={[deskS.navLabel, focused && deskS.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Phone / tablet: bottom bar
  return (
    <View style={mobileTabS.bar}>
      {TAB_ITEMS.map((item, index) => {
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={item.name}
            style={mobileTabS.item}
            onPress={() => navigation.navigate(item.name)}
          >
            <TabIcon iconName={item.icon} label={item.label} focused={focused} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const deskS = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.border,
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 16,
  },
  logoWrap: { marginBottom: 40, paddingHorizontal: 8 },
  logoText: { fontSize: 28, fontWeight: '700', color: C.forest, letterSpacing: -0.5 },
  logoSub:  { fontSize: 12, color: C.muted, marginTop: 2 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 4,
  },
  navItemActive: { backgroundColor: C.sagePale },
  navLabel:      { fontSize: 15, fontWeight: '500', color: C.muted },
  navLabelActive:{ fontWeight: '700', color: C.forest },
});

const mobileTabS = StyleSheet.create({
  bar: {
    backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border,
    height: 72, paddingBottom: 8, flexDirection: 'row',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home"        component={HomeScreen} />
      <HomeStackNav.Screen name="Journal"     component={JournalScreen} />
      <HomeStackNav.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
      <HomeStackNav.Screen name="IdeaBank"    component={IdeaBankScreen} />
      <HomeStackNav.Screen name="Sprint"      component={SprintScreen} options={{ presentation: 'fullScreenModal' }} />
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
  const layout = useLayout();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      tabBarPosition={layout === 'desktop' ? 'left' : 'bottom'}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="GrowTab" component={GrowStack} />
      <Tab.Screen name="Goals"   component={GoalsScreen} />
      <Tab.Screen name="Buddy"   component={BuddyStack} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: C.forest, marginTop: 14 }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Gentle guidance. Real progress.</Text>
    </View>
  );
}

function RootNavigator() {
  const { loaded, hasOnboarded, finishOnboarding } = useApp();
  if (!loaded) return <SplashScreen />;
  if (!hasOnboarded) return <OnboardingScreen onFinish={finishOnboarding} />;
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function ResponsiveShell({ children }) {
  const layout = useLayout();

  if (Platform.OS !== 'web' || layout !== 'phone') {
    // Native app or tablet/desktop: fill the whole screen
    return <View style={{ flex: 1, backgroundColor: C.cream }}>{children}</View>;
  }

  // Small phone browser: centre the app in a 430px column
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#E8E3DC' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: C.cream, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <ResponsiveShell>
            <RootNavigator />
          </ResponsiveShell>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
