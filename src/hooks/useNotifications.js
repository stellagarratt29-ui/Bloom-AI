import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_HOUR_KEY  = '@bloom_notif_hour';
const NOTIF_MIN_KEY   = '@bloom_notif_min';
const NOTIF_ASKED_KEY = '@bloom_notif_asked';
const DEFAULT_HOUR    = 8;
const DEFAULT_MIN     = 0;

// ── Web helpers ──────────────────────────────────────────────────────────────

function canNotifyWeb() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'Notification' in window
  );
}

async function requestWebPermission() {
  if (!canNotifyWeb()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function fireWebReminder() {
  if (!canNotifyWeb() || Notification.permission !== 'granted') return;
  new Notification('Good morning 🌸', {
    body: "Ready to plan your day? Open Bloom and brain-dump everything on your mind.",
    icon: '/Bloom-AI/favicon.ico',
    tag:  'bloom-morning',
  });
}

// ── Native helpers (expo-notifications) ─────────────────────────────────────

let Notifications = null;
if (Platform.OS !== 'web') {
  try { Notifications = require('expo-notifications'); } catch {}
}

async function requestNativePermission() {
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleNativeReminder(hour, min) {
  if (!Notifications) return;
  // Cancel any previously scheduled Bloom reminders
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning 🌸',
      body:  "Ready to plan your day? Open Bloom and brain-dump everything on your mind.",
    },
    trigger: {
      type:     'daily',
      hour,
      minute:   min,
      repeats:  true,
    },
  });
}

async function cancelNativeReminders() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Shared public API ────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return requestWebPermission();
  return requestNativePermission();
}

export async function getNotificationTime() {
  try {
    const h = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
    const m = await AsyncStorage.getItem(NOTIF_MIN_KEY);
    return {
      hour: h !== null ? parseInt(h) : DEFAULT_HOUR,
      min:  m !== null ? parseInt(m) : DEFAULT_MIN,
    };
  } catch {
    return { hour: DEFAULT_HOUR, min: DEFAULT_MIN };
  }
}

export async function setNotificationTime(hour, min) {
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour)).catch(() => {});
  await AsyncStorage.setItem(NOTIF_MIN_KEY,  String(min)).catch(() => {});
  // Re-schedule native reminder at the new time
  if (Platform.OS !== 'web') {
    try {
      const granted = await requestNativePermission();
      if (granted) await scheduleNativeReminder(hour, min);
    } catch {}
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(hasOnboarded) {
  const firedTodayRef = useRef(false);
  const dateRef       = useRef(new Date().toDateString());

  useEffect(() => {
    if (!hasOnboarded) return;

    if (Platform.OS !== 'web') {
      // Native: ask once, then schedule a recurring daily notification
      AsyncStorage.getItem(NOTIF_ASKED_KEY).then(async asked => {
        if (!asked) {
          await AsyncStorage.setItem(NOTIF_ASKED_KEY, '1').catch(() => {});
          const granted = await requestNativePermission();
          if (granted) {
            const { hour, min } = await getNotificationTime();
            await scheduleNativeReminder(hour, min);
          }
        }
      }).catch(() => {});
      return;
    }

    // Web: poll every minute and fire when time matches
    if (!canNotifyWeb()) return;

    AsyncStorage.getItem(NOTIF_ASKED_KEY).then(asked => {
      if (!asked) {
        requestWebPermission().then(() =>
          AsyncStorage.setItem(NOTIF_ASKED_KEY, '1').catch(() => {})
        );
      }
    }).catch(() => {});

    const check = async () => {
      const now   = new Date();
      const today = now.toDateString();

      if (today !== dateRef.current) {
        firedTodayRef.current = false;
        dateRef.current = today;
      }
      if (firedTodayRef.current) return;

      const { hour, min } = await getNotificationTime();
      if (now.getHours() === hour && now.getMinutes() === min) {
        firedTodayRef.current = true;
        fireWebReminder();
      }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [hasOnboarded]);
}
