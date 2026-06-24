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
import BloomChatScreen       from './src/screens/BloomChatScreen';
import TaskGuideScreen       from './src/screens/TaskGuideScreen';
import HobbiesScreen         from './src/screens/HobbiesScreen';
import GoalsScreen           from './src/screens/GoalsScreen';
import ScreenAwarenessScreen from './src/screens/ScreenAwarenessScreen';

const RootStack    = createNativeStackNavigator();
const ChatStackNav = createNativeStackNavigator();
const Tab          = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'ChatTab',    icon: 'message-circle', label: 'Today'    },
  { name: 'GrowTab',    icon: 'sun',            label: 'Grow'     },
  { name: 'GoalsTab',   icon: 'target',         label: 'Goals'    },
  { name: 'ScreenTab',  icon: 'smartphone',     label: 'Screen'   },
];

const SIDEBAR_W = 200;

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
      <Feather name={iconName} size={21} color={focused ? C.forest : C.muted} />
      <Text style={{
        fontSize: 10, marginTop: 3,
        fontWeight: focused ? '700' : '500',
        color: focused ? C.forest : C.muted,
      }}>{label}</Text>
    </View>
  );
}

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
              <Feather name={item.icon} size={18} color={focused ? C.forest : C.muted} />
              <Text style={[deskS.navLabel, focused && deskS.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

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
  logoText: { fontSize: 24, fontWeight: '800', color: C.clay, letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined },
  logoSub:  { fontSize: 11, color: C.muted, marginTop: 2 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 2,
  },
  navItemActive: { backgroundColor: C.sagePale },
  navLabel:      { fontSize: 14, fontWeight: '500', color: C.muted },
  navLabelActive:{ fontWeight: '700', color: C.forest },
});

const mobileTabS = StyleSheet.create({
  bar: {
    backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border,
    height: 72, paddingBottom: 8, flexDirection: 'row',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

function ChatStack() {
  return (
    <ChatStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatStackNav.Screen name="BloomChat" component={BloomChatScreen} />
      <ChatStackNav.Screen name="TaskGuide" component={TaskGuideScreen} />
    </ChatStackNav.Navigator>
  );
}

function MainTabs() {
  const layout = useLayout();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      tabBarPosition={layout === 'desktop' ? 'left' : 'bottom'}
      screenOptions={{ headerShown: false }}
      initialRouteName="ChatTab"
    >
      <Tab.Screen name="ChatTab"   component={ChatStack} />
      <Tab.Screen name="GrowTab"   component={HobbiesScreen} />
      <Tab.Screen name="GoalsTab"  component={GoalsScreen} />
      <Tab.Screen name="ScreenTab" component={ScreenAwarenessScreen} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color: C.clay, letterSpacing: -0.5,
        fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>Gentle guidance. Real progress.</Text>
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
    return <View style={{ flex: 1, backgroundColor: C.cream }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EAE5DE' }}>
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
