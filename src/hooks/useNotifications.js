import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_HOUR_KEY = '@bloom_notif_hour';
const NOTIF_MIN_KEY  = '@bloom_notif_min';
const NOTIF_ASKED_KEY = '@bloom_notif_asked';
const DEFAULT_HOUR = 8;
const DEFAULT_MIN  = 0;

function canNotify() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'Notification' in window
  );
}

export async function requestNotificationPermission() {
  if (!canNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  await AsyncStorage.setItem(NOTIF_ASKED_KEY, '1').catch(() => {});
  return result === 'granted';
}

export async function getNotificationTime() {
  try {
    const h = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
    const m = await AsyncStorage.getItem(NOTIF_MIN_KEY);
    return { hour: h !== null ? parseInt(h) : DEFAULT_HOUR, min: m !== null ? parseInt(m) : DEFAULT_MIN };
  } catch {
    return { hour: DEFAULT_HOUR, min: DEFAULT_MIN };
  }
}

export async function setNotificationTime(hour, min) {
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour)).catch(() => {});
  await AsyncStorage.setItem(NOTIF_MIN_KEY,  String(min)).catch(() => {});
}

function fireReminder() {
  if (!canNotify() || Notification.permission !== 'granted') return;
  new Notification('Good morning 🌸', {
    body: "Ready to plan your day? Open Bloom and brain-dump everything on your mind.",
    icon: '/Bloom-AI/favicon.ico',
    tag: 'bloom-morning',
  });
}

// Runs inside a component — checks every minute if it's time to remind
export function useNotifications(hasOnboarded) {
  const firedTodayRef = useRef(false);
  const dateRef = useRef(new Date().toDateString());

  useEffect(() => {
    if (!hasOnboarded || !canNotify()) return;

    // Ask for permission once, the first time user has onboarded
    AsyncStorage.getItem(NOTIF_ASKED_KEY).then(asked => {
      if (!asked) requestNotificationPermission();
    }).catch(() => {});

    const check = async () => {
      const now = new Date();
      const today = now.toDateString();

      // Reset fired flag at midnight
      if (today !== dateRef.current) {
        firedTodayRef.current = false;
        dateRef.current = today;
      }
      if (firedTodayRef.current) return;

      const { hour, min } = await getNotificationTime();
      if (now.getHours() === hour && now.getMinutes() === min) {
        firedTodayRef.current = true;
        fireReminder();
      }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [hasOnboarded]);
}
