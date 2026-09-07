import React, { useRef, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text, View, Platform, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from './src/components/Icon';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
  require('react-native-screens').enableScreens();
  try {
    const Notifs = require('expo-notifications');
    Notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
}

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { C } from './src/constants/colors';
import DyslexiaStyleInjector from './src/components/DyslexiaStyleInjector';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LandingScreen    from './src/screens/LandingScreen';
import TodayScreen      from './src/screens/TodayScreen';
import BloomChatScreen  from './src/screens/BloomChatScreen';
import TaskGuideScreen  from './src/screens/TaskGuideScreen';
import YouScreen        from './src/screens/YouScreen';

const RootStack     = createNativeStackNavigator();
const TodayStackNav = createNativeStackNavigator();
const Tab           = createBottomTabNavigator();

// ─── Tab definitions ─────────────────────────────────
const TABS = [
  { name: 'TodayTab', icon: 'sun',          label: 'Today' },
  { name: 'ChatTab',  icon: 'message-circle', label: 'Chat'  },
  { name: 'YouTab',   icon: 'user',          label: 'You'   },
];

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', fontFamily: 'monospace' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Custom minimal tab bar ───────────────────────────
function CustomTabBar({ state, navigation }) {
  const { colors: t, isDark } = useTheme();

  const barBg = Platform.OS === 'web'
    ? (isDark ? 'rgba(15,15,18,0.94)' : 'rgba(255,255,255,0.94)')
    : (t.card);

  return (
    <View style={[
      tabS.bar,
      {
        backgroundColor: barBg,
        borderTopColor: t.border,
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        } : {}),
      },
    ]}>
      {TABS.map((item, index) => {
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={item.name}
            style={tabS.item}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            {focused ? (
              <View style={[tabS.pill, { backgroundColor: t.accent }]}>
                <Icon name={item.icon} size={15} color="#FFFFFF" />
                <Text style={tabS.pillLabel}>{item.label}</Text>
              </View>
            ) : (
              <View style={tabS.iconWrap}>
                <Icon name={item.icon} size={22} color={t.subtext} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabS = StyleSheet.create({
  bar: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    outlineStyle: 'none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  iconWrap: {
    padding: 8,
    borderRadius: 12,
  },
});

// ─── Stacks ───────────────────────────────────────────
function TodayStack() {
  return (
    <TodayStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TodayStackNav.Screen name="TodayHome" component={TodayScreen} />
      <TodayStackNav.Screen name="TaskGuide" component={TaskGuideScreen} />
    </TodayStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="TodayTab"
    >
      <Tab.Screen name="TodayTab" component={TodayStack} />
      <Tab.Screen name="ChatTab"  component={BloomChatScreen} />
      <Tab.Screen name="YouTab"   component={YouScreen} />
    </Tab.Navigator>
  );
}

// ─── Splash ───────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontSize: 32, fontWeight: '800', color: C.moss, letterSpacing: -0.5,
        fontFamily: Platform.OS === 'web' ? '"Outfit", system-ui, sans-serif' : undefined,
      }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
        Scroll time → productive time.
      </Text>
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────
function RootNavigator() {
  const { loaded, hasOnboarded, finishOnboarding } = useApp();
  const navRef = useRef(null);
  const [landingSeen, setLandingSeen] = useState(false);

  if (!loaded) return <SplashScreen />;
  if (!hasOnboarded && !landingSeen) return <LandingScreen onGetStarted={() => setLandingSeen(true)} />;
  if (!hasOnboarded) return <OnboardingScreen onFinish={finishOnboarding} />;

  return (
    <NavigationContainer ref={navRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ─── Shell (phone width constraint on web) ────────────
function ThemedShell({ children }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: Platform.OS === 'web' ? '#E8E6E3' : colors.bg }}>
      <View style={{
        flex: 1,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 430 : undefined,
        backgroundColor: colors.bg,
        overflow: 'hidden',
      }}>
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
          <DyslexiaStyleInjector />
          <ThemeProvider>
            <ThemedShell>
              <RootNavigator />
            </ThemedShell>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
