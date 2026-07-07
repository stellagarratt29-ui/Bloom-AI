import React, { useRef, useState, useCallback } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
  require('react-native-screens').enableScreens();
}

import { GameProvider } from './src/context/AppContext';
import Icon from './src/components/Icon';
import Sidebar from './src/components/Sidebar';
import { C } from './src/constants/theme';

const DESKTOP_BREAKPOINT = 860;
const navigationRef = createNavigationContainerRef();

import HomeScreen from './src/screens/HomeScreen';
import NewWorldScreen from './src/screens/NewWorldScreen';
import WorldScreen from './src/screens/WorldScreen';
import BuildScreen from './src/screens/BuildScreen';
import Play3DScreen from './src/screens/Play3DScreen';
import AIDesignerScreen from './src/screens/AIDesignerScreen';
import InspirationScreen from './src/screens/InspirationScreen';
import InspirationBoardScreen from './src/screens/InspirationBoardScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import BuildDetailScreen from './src/screens/BuildDetailScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const SHARED_SCREENS = (Nav) => (
  <>
    <Nav.Screen name="NewWorld" component={NewWorldScreen} />
    <Nav.Screen name="World" component={WorldScreen} />
    <Nav.Screen name="Build" component={BuildScreen} />
    <Nav.Screen name="AIDesigner" component={AIDesignerScreen} options={{ presentation: 'modal' }} />
    <Nav.Screen name="Inspiration" component={InspirationScreen} />
    <Nav.Screen name="InspirationBoard" component={InspirationBoardScreen} />
    <Nav.Screen name="BuildDetail" component={BuildDetailScreen} />
    <Nav.Screen name="Challenges" component={ChallengesScreen} />
    <Nav.Screen name="Friends" component={FriendsScreen} />
    <Nav.Screen name="Messages" component={MessagesScreen} />
    <Nav.Screen name="Notifications" component={NotificationsScreen} />
    <Nav.Screen name="Settings" component={SettingsScreen} />
    <Nav.Screen name="Marketplace" component={MarketplaceScreen} />
    <Nav.Screen name="Profile" component={ProfileScreen} />
    <Nav.Screen name="Explore" component={ExploreScreen} />
  </>
);

function HomeStackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      {SHARED_SCREENS(Stack)}
    </Stack.Navigator>
  );
}

function ExploreStackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      {SHARED_SCREENS(Stack)}
    </Stack.Navigator>
  );
}

function MarketplaceStackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketplaceMain" component={MarketplaceScreen} />
      {SHARED_SCREENS(Stack)}
    </Stack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      {SHARED_SCREENS(Stack)}
    </Stack.Navigator>
  );
}

const TAB_ITEMS = [
  { name: 'HomeTab', icon: 'home', label: 'Home', component: HomeStackNav },
  { name: 'ExploreTab', icon: 'compass', label: 'Explore', component: ExploreStackNav },
  { name: 'MarketplaceTab', icon: 'shopping-bag', label: 'Shop', component: MarketplaceStackNav },
  { name: 'ProfileTab', icon: 'user', label: 'Profile', component: ProfileStackNav },
];

function TabBarIcon({ name, focused }) {
  return <Icon name={name} size={22} color={focused ? C.accent : C.textFaint} />;
}

const ROUTE_TO_NAV_KEY = {
  HomeMain: 'continue', World: 'continue', NewWorld: 'continue', Build: 'continue',
  ExploreMain: 'explore',
  Inspiration: 'inspiration', InspirationBoard: 'inspiration',
  Challenges: 'challenges',
  MarketplaceMain: 'marketplace',
  Friends: 'friends',
  Messages: 'messages',
};

function MainTabs({ isDesktop, activeRouteName }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {isDesktop && (
        <Sidebar navigationRef={navigationRef} activeRouteName={ROUTE_TO_NAV_KEY[activeRouteName]} />
      )}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: C.accent,
            tabBarInactiveTintColor: C.textFaint,
            tabBarStyle: isDesktop ? { display: 'none' } : { backgroundColor: C.surface, borderTopColor: C.border },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ focused }) => {
              const item = TAB_ITEMS.find(t => t.name === route.name);
              return <TabBarIcon name={item.icon} focused={focused} />;
            },
          })}
        >
          {TAB_ITEMS.map(t => (
            <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.label }} />
          ))}
        </Tab.Navigator>
      </View>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const [activeRouteName, setActiveRouteName] = useState(null);

  const handleStateChange = useCallback(() => {
    if (navigationRef.isReady()) {
      setActiveRouteName(navigationRef.getCurrentRoute()?.name ?? null);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer ref={navigationRef} onReady={handleStateChange} onStateChange={handleStateChange}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main">
              {() => <MainTabs isDesktop={isDesktop} activeRouteName={activeRouteName} />}
            </RootStack.Screen>
            <RootStack.Screen name="Play3D" component={Play3DScreen} options={{ animation: 'fade' }} />
          </RootStack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}
