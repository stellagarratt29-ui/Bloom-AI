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
  // Configure how notifications appear when the app is in the foreground
  try {
    const Notifs = require('expo-notifications');
    Notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  false,
      }),
    });
  } catch {}
}

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { C } from './src/constants/colors';
import DyslexiaStyleInjector from './src/components/DyslexiaStyleInjector';
import { useNotifications } from './src/hooks/useNotifications';

import OnboardingScreen      from './src/screens/OnboardingScreen';
import LandingScreen        from './src/screens/LandingScreen';
import TutorialScreen        from './src/screens/TutorialScreen';
import BloomChatScreen       from './src/screens/BloomChatScreen';
import TaskGuideScreen       from './src/screens/TaskGuideScreen';
import TasksScreen           from './src/screens/TasksScreen';
import HobbiesScreen         from './src/screens/HobbiesScreen';
import HobbyDetailScreen     from './src/screens/HobbyDetailScreen';
import GoalsScreen           from './src/screens/GoalsScreen';
import GoalDetailScreen      from './src/screens/GoalDetailScreen';
import CalendarScreen        from './src/screens/CalendarScreen';
import ScreenAwarenessScreen from './src/screens/ScreenAwarenessScreen';
import YearReviewScreen      from './src/screens/YearReviewScreen';
import SettingsScreen        from './src/screens/SettingsScreen';

const RootStack      = createNativeStackNavigator();
const ChatStackNav   = createNativeStackNavigator();
const TasksStackNav  = createNativeStackNavigator();
const GrowStackNav   = createNativeStackNavigator();
const GoalsStackNav  = createNativeStackNavigator();
const Tab            = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: 'ChatTab',     icon: 'message-circle', label: 'Chat'     },
  { name: 'TasksTab',    icon: 'list',           label: 'Tasks'    },
  { name: 'GrowTab',     icon: 'sun',            label: 'Grow'     },
  { name: 'GoalsTab',    icon: 'target',         label: 'Goals'    },
  { name: 'CalendarTab', icon: 'calendar',       label: 'Calendar' },
  { name: 'ScreenTab',   icon: 'smartphone',     label: 'Screen'   },
  { name: 'SettingsTab', icon: 'settings',       label: 'Settings' },
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

function CustomTabBar({ state, navigation }) {
  const layout = useLayout();
  const { colors, isDark } = useTheme();

  if (layout === 'desktop') {
    return (
      <View style={[deskS.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
        <View style={deskS.logoWrap}>
          <Text style={[deskS.logoText, { color: colors.moss }]}>Bloom</Text>
          <Text style={[deskS.logoSub, { color: colors.subtext }]}>Your gentle guide.</Text>
        </View>
        {TAB_ITEMS.map((item, index) => {
          const focused = state.index === index;
          return (
            <TouchableOpacity
              key={item.name}
              style={[deskS.navItem, focused && { backgroundColor: colors.sagePale }]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Icon name={item.icon} size={17} color={focused ? colors.moss : colors.subtext} />
              <Text style={[deskS.navLabel, { color: colors.subtext }, focused && { fontWeight: '700', color: colors.moss }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Mobile tab bar — frosted glass pill design
  const barBg = isDark ? 'rgba(32,28,30,0.92)' : 'rgba(255,255,255,0.92)';

  return (
    <View style={[
      mobileTabS.bar,
      Platform.OS === 'web'
        ? { backgroundColor: barBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTopColor: colors.border }
        : { backgroundColor: colors.card, borderTopColor: colors.border },
    ]}>
      {TAB_ITEMS.map((item, index) => {
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={item.name}
            style={mobileTabS.item}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            {focused ? (
              // Active: filled pill with icon + label
              <View style={[mobileTabS.pill, { backgroundColor: colors.moss }]}>
                <Icon name={item.icon} size={16} color="#FFFFFF" />
                <Text style={mobileTabS.pillLabel}>{item.label}</Text>
              </View>
            ) : (
              // Inactive: icon only, no label
              <View style={mobileTabS.iconWrap}>
                <Icon name={item.icon} size={20} color={colors.subtext} />
              </View>
            )}
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
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 14,
  },
  logoWrap: { marginBottom: 36, paddingHorizontal: 10 },
  logoText: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined,
  },
  logoSub:  { fontSize: 11, marginTop: 3 },
  navItem:  {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 2,
  },
  navLabel: { fontSize: 14, fontWeight: '500' },
});

const mobileTabS = StyleSheet.create({
  bar: {
    borderTopWidth: 0.5,
    height: 72,
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    // Subtle top shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
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
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  iconWrap: {
    padding: 6,
    borderRadius: 10,
  },
});

function ChatStack() {
  return (
    <ChatStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatStackNav.Screen name="BloomChat" component={BloomChatScreen} />
    </ChatStackNav.Navigator>
  );
}

function TasksStack() {
  return (
    <TasksStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TasksStackNav.Screen name="TasksList" component={TasksScreen} />
      <TasksStackNav.Screen name="TaskGuide" component={TaskGuideScreen} />
    </TasksStackNav.Navigator>
  );
}

function GrowStack() {
  return (
    <GrowStackNav.Navigator screenOptions={{ headerShown: false }}>
      <GrowStackNav.Screen name="Hobbies"     component={HobbiesScreen} />
      <GrowStackNav.Screen name="HobbyDetail" component={HobbyDetailScreen} />
      <GrowStackNav.Screen name="YearReview"  component={YearReviewScreen} />
    </GrowStackNav.Navigator>
  );
}

function GoalsStack() {
  return (
    <GoalsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <GoalsStackNav.Screen name="GoalsList"  component={GoalsScreen} />
      <GoalsStackNav.Screen name="GoalDetail" component={GoalDetailScreen} />
    </GoalsStackNav.Navigator>
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
      <Tab.Screen name="ChatTab"     component={ChatStack} />
      <Tab.Screen name="TasksTab"    component={TasksStack} />
      <Tab.Screen name="GrowTab"     component={GrowStack} />
      <Tab.Screen name="GoalsTab"    component={GoalsStack} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} />
      <Tab.Screen name="ScreenTab"   component={ScreenAwarenessScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color: C.clay, letterSpacing: -0.5,
        fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined }}>Bloom</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>Gentle guidance. Real progress.</Text>
    </View>
  );
}

function RootNavigator() {
  const { loaded, hasOnboarded, finishOnboarding } = useApp();
  useNotifications(hasOnboarded);
  const navRef = useRef(null);

  // Once the navigator is mounted, check if we're returning from a Google OAuth redirect
  // (sessionStorage flag was set by startCalendarOAuth before the redirect)
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

function ThemedShell({ children }) {
  const { colors } = useTheme();
  const layout = useLayout();
  if (Platform.OS !== 'web' || layout !== 'phone') {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.bg, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function TutorialOverlay() {
  const { hasOnboarded, tutorialSeen, setTutorialSeen, showTutorialReplay, closeTutorial } = useApp();
  const { colors } = useTheme();

  const visible = (hasOnboarded && !tutorialSeen) || showTutorialReplay;
  if (!visible) return null;

  const handleDone = () => {
    setTutorialSeen(true);
    closeTutorial();
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: colors.bg }}>
      <TutorialScreen onDone={handleDone} />
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
              <TutorialOverlay />
            </ThemedShell>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
