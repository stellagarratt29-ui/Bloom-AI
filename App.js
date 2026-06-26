import React from 'react';
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
}

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { C } from './src/constants/colors';

import OnboardingScreen      from './src/screens/OnboardingScreen';
import BloomChatScreen       from './src/screens/BloomChatScreen';
import TaskGuideScreen       from './src/screens/TaskGuideScreen';
import TasksScreen           from './src/screens/TasksScreen';
import HobbiesScreen         from './src/screens/HobbiesScreen';
import HobbyDetailScreen     from './src/screens/HobbyDetailScreen';
import GoalsScreen           from './src/screens/GoalsScreen';
import GoalDetailScreen      from './src/screens/GoalDetailScreen';
import CalendarScreen        from './src/screens/CalendarScreen';
import ScreenAwarenessScreen from './src/screens/ScreenAwarenessScreen';
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

function TabIcon({ iconName, label, focused }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingTop: 2 }}>
      <View style={[
        { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 4, marginBottom: 1 },
        focused && { backgroundColor: C.sagePale },
      ]}>
        <Icon name={iconName} size={18} color={focused ? C.moss : colors.subtext} />
      </View>
      <Text style={{ fontSize: 9, fontWeight: focused ? '700' : '500', color: focused ? C.moss : colors.subtext }}>
        {label}
      </Text>
    </View>
  );
}

function CustomTabBar({ state, navigation }) {
  const layout = useLayout();
  const { colors } = useTheme();

  if (layout === 'desktop') {
    return (
      <View style={[deskS.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
        <View style={deskS.logoWrap}>
          <Text style={[deskS.logoText, { color: C.clay }]}>Bloom</Text>
          <Text style={[deskS.logoSub, { color: colors.subtext }]}>Gentle progress.</Text>
        </View>
        {TAB_ITEMS.map((item, index) => {
          const focused = state.index === index;
          return (
            <TouchableOpacity
              key={item.name}
              style={[deskS.navItem, focused && { backgroundColor: C.sagePale }]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Icon name={item.icon} size={18} color={focused ? C.moss : colors.subtext} />
              <Text style={[deskS.navLabel, { color: colors.subtext }, focused && { fontWeight: '700', color: C.moss }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[mobileTabS.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
    borderRightWidth: 1,
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 16,
  },
  logoWrap: { marginBottom: 40, paddingHorizontal: 8 },
  logoText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined },
  logoSub:  { fontSize: 11, marginTop: 2 },
  navItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 2 },
  navLabel: { fontSize: 14, fontWeight: '500' },
});

const mobileTabS = StyleSheet.create({
  bar:  { borderTopWidth: 1, height: 64, paddingBottom: 4, flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', outlineStyle: 'none' },
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

function ThemedShell({ children }) {
  const { colors } = useTheme();
  const layout = useLayout();
  if (Platform.OS !== 'web' || layout !== 'phone') {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EAE5DE' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.bg, overflow: 'hidden' }}>
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
