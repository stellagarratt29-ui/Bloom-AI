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
        shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
      }),
    });
  } catch {}
}

import { AppProvider, useApp }     from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { C } from './src/constants/colors';
import DyslexiaStyleInjector from './src/components/DyslexiaStyleInjector';
import { useNotifications } from './src/hooks/useNotifications';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LandingScreen    from './src/screens/LandingScreen';
import TutorialScreen   from './src/screens/TutorialScreen';
import BloomChatScreen  from './src/screens/BloomChatScreen';
import TaskGuideScreen  from './src/screens/TaskGuideScreen';
import TasksScreen      from './src/screens/TasksScreen';
import LifeScreen       from './src/screens/LifeScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

const RootStack    = createNativeStackNavigator();
const ChatStackNav = createNativeStackNavigator();
const PlanStackNav = createNativeStackNavigator();
const LifeStackNav = createNativeStackNavigator();
const Tab          = createBottomTabNavigator();

// ─── 3 tabs ──────────────────────────────────────────
const TAB_ITEMS = [
  { name: 'ChatTab', icon: 'message-circle', label: 'Chat' },
  { name: 'PlanTab', icon: 'check-square',   label: 'Plan' },
  { name: 'LifeTab', icon: 'compass',        label: 'Life' },
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
    if (this.state.error) return (
      <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 12 }}>Something went wrong</Text>
        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', fontFamily: 'monospace' }}>
          {this.state.error.message}
        </Text>
      </View>
    );
    return this.props.children;
  }
}

// ─── Custom tab bar — Studio Minimal ─────────────────
function CustomTabBar({ state, navigation }) {
  const layout = useLayout();
  const { colors: t, isDark } = useTheme();

  // Desktop sidebar — slim, no heavy fill
  if (layout === 'desktop') {
    return (
      <View style={[deskS.sidebar, { backgroundColor: t.bg, borderRightColor: t.border }]}>
        <View style={deskS.logoWrap}>
          <Text style={[deskS.logoText, { color: t.text }]}>bloom</Text>
        </View>
        {TAB_ITEMS.map((item, index) => {
          const focused = state.index === index;
          return (
            <TouchableOpacity
              key={item.name}
              style={[deskS.navItem, focused && deskS.navItemActive]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.65}
            >
              <Icon name={item.icon} size={16} color={focused ? t.text : t.muted} />
              <Text style={[
                deskS.navLabel,
                { color: focused ? t.text : t.muted },
                focused && { fontWeight: '600' },
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Mobile tab bar — ultra-clean, thin indicator
  const barBg = Platform.OS === 'web'
    ? (isDark ? 'rgba(26,21,16,0.96)' : 'rgba(250,247,242,0.97)')
    : t.bg;

  return (
    <View style={[
      mobileTabS.bar,
      {
        backgroundColor: barBg,
        borderTopColor: t.border,
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } : {}),
      },
    ]}>
      {TAB_ITEMS.map((item, index) => {
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={item.name}
            style={mobileTabS.item}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.6}
          >
            {focused && <View style={[mobileTabS.indicator, { backgroundColor: t.text }]} />}
            <Icon
              name={item.icon}
              size={20}
              color={focused ? t.text : t.muted}
            />
            <Text style={[
              mobileTabS.label,
              { color: focused ? t.text : t.muted },
              focused && { fontWeight: '600' },
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const deskS = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_W,
    borderRightWidth: 1,
    paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16,
  },
  logoWrap: { marginBottom: 44, paddingHorizontal: 8 },
  logoText: {
    fontSize: 18, fontWeight: '700', letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 8, marginBottom: 1,
  },
  navItemActive: {
    // just text/icon change — no background fill
  },
  navLabel: { fontSize: 13, fontWeight: '400', letterSpacing: 0.1 },
});

const mobileTabS = StyleSheet.create({
  bar: {
    borderTopWidth: 0.5,
    height: 64,
    paddingHorizontal: 0,
    paddingBottom: 4,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 0,
    gap: 3,
    outlineStyle: 'none',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 1.5,
    borderRadius: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
});

// ─── Stacks ───────────────────────────────────────────
function ChatStack() {
  return (
    <ChatStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatStackNav.Screen name="BloomChat" component={BloomChatScreen} />
    </ChatStackNav.Navigator>
  );
}

function PlanStack() {
  return (
    <PlanStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PlanStackNav.Screen name="PlanList"  component={TasksScreen} />
      <PlanStackNav.Screen name="TaskGuide" component={TaskGuideScreen} />
    </PlanStackNav.Navigator>
  );
}

function LifeStack() {
  return (
    <LifeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LifeStackNav.Screen name="LifeMain" component={LifeScreen} />
    </LifeStackNav.Navigator>
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
      <Tab.Screen name="ChatTab" component={ChatStack} />
      <Tab.Screen name="PlanTab" component={PlanStack} />
      <Tab.Screen name="LifeTab" component={LifeStack} />
    </Tab.Navigator>
  );
}

// ─── Splash ───────────────────────────────────────────
function SplashScreen() {
  const { colors: t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t?.bg ?? '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontSize: 28, fontWeight: '700', color: t?.text ?? '#1A1510', letterSpacing: -0.5,
        fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
      }}>bloom</Text>
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────
function RootNavigator() {
  const { loaded, hasOnboarded, finishOnboarding } = useApp();
  useNotifications(hasOnboarded);
  const navRef = useRef(null);

  const handleNavReady = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const tab = window.sessionStorage.getItem('bloomOAuthReturn');
    if (tab) {
      window.sessionStorage.removeItem('bloomOAuthReturn');
      navRef.current?.navigate('Main', { screen: tab });
    }
  }, []);

  const [landingSeen, setLandingSeen] = useState(false);

  if (!loaded) return <SplashScreen />;
  if (!hasOnboarded && !landingSeen) return <LandingScreen onGetStarted={() => setLandingSeen(true)} />;
  if (!hasOnboarded) return <OnboardingScreen onFinish={finishOnboarding} />;

  return (
    <NavigationContainer ref={navRef} onReady={handleNavReady}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ─── Tutorial overlay ─────────────────────────────────
function TutorialOverlay() {
  const { hasOnboarded, tutorialSeen, setTutorialSeen, showTutorialReplay, closeTutorial } = useApp();
  const { colors: t } = useTheme();

  const visible = (hasOnboarded && !tutorialSeen) || showTutorialReplay;
  if (!visible) return null;

  const handleDone = () => { setTutorialSeen(true); closeTutorial(); };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: t.bg }}>
      <TutorialScreen onDone={handleDone} />
    </View>
  );
}

// ─── Shell — no gray wrapper, full bleed ─────────────
function ThemedShell({ children }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;
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
              <TutorialOverlay />
            </ThemedShell>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
