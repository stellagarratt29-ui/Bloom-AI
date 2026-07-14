import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

const LOC_KEY    = '@bloom_location';
const DENIED_KEY = '@bloom_location_denied';

// ── Storage ──────────────────────────────────────────────────────────────────

export async function getSavedLocation() {
  try {
    const raw = await AsyncStorage.getItem(LOC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveLocation(coords) {
  try { await AsyncStorage.setItem(LOC_KEY, JSON.stringify(coords)); } catch {}
}

export async function clearLocation() {
  try {
    await AsyncStorage.removeItem(LOC_KEY);
    await AsyncStorage.removeItem(DENIED_KEY);
  } catch {}
}

export async function wasLocationDenied() {
  try { return (await AsyncStorage.getItem(DENIED_KEY)) === 'true'; } catch { return false; }
}

export async function markLocationDenied() {
  try { await AsyncStorage.setItem(DENIED_KEY, 'true'); } catch {}
}

// ── Permission + Fetch ───────────────────────────────────────────────────────

export async function requestLocation() {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (!navigator?.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          saveLocation(coords);
          resolve(coords);
        },
        () => { markLocationDenied(); resolve(null); },
        { timeout: 10000, maximumAge: 3600000 }
      );
    });
  }

  try {
    const ExpoLocation = require('expo-location');
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') { markLocationDenied(); return null; }
    const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    await saveLocation(coords);
    return coords;
  } catch { return null; }
}

// ── Geocoding via Nominatim (OpenStreetMap — free, no key) ───────────────────

export async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  try {
    const q   = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'BloomAI/1.0' } });
    const data = await res.json();
    const place = data?.[0];
    if (!place) return null;
    return { latitude: parseFloat(place.lat), longitude: parseFloat(place.lon), placeName: place.display_name };
  } catch { return null; }
}

// ── Routing via OSRM (free, no key, driving times) ───────────────────────────

export async function getTravelTime(origin, destination) {
  if (!origin || !destination) return null;
  try {
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
    const res  = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    return Math.round(route.duration / 60); // minutes
  } catch { return null; }
}

// ── Deep-link fallback ───────────────────────────────────────────────────────

export function openInMaps(destination) {
  const q = encodeURIComponent(destination);
  if (Platform.OS === 'ios') {
    Linking.openURL(`maps://?daddr=${q}&dirflg=d`).catch(() =>
      Linking.openURL(`comgooglemaps://?daddr=${q}&directionsmode=driving`).catch(() =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`)
      )
    );
  } else if (Platform.OS === 'android') {
    Linking.openURL(`google.navigation:q=${q}`).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`)
    );
  } else {
    // Web — open Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
  }
}

// ── Commute query detection ──────────────────────────────────────────────────

export function isCommuteQuery(text) {
  const t = text.toLowerCase();
  return (
    /when (do i|should i) (leave|go|set off|head out|depart)/.test(t) ||
    /what time (do i|should i) (leave|set off|head out|depart)/.test(t) ||
    /how long (will it|does it) take (to get|to drive|to travel)/.test(t) ||
    /how far (is|away is)/.test(t) ||
    /what time (to leave|to head)/.test(t) ||
    /leave by|leave for|need to leave/.test(t) ||
    /(travel|commute|drive|get) (time|there|to)/.test(t) ||
    /minutes? (early|before|to get)/.test(t)
  );
}

// Extract destination from commute query
export function extractDestination(text) {
  const patterns = [
    /(?:leave for|heading to|going to|get to|travel to|drive to|arrive at|make it to)\s+(.+?)(?:\s+(?:by|at|in|to make|on time|early|before)|[?.!]|$)/i,
    /(?:when.*leave|what time.*leave|need to leave)\s+for\s+(.+?)(?:\s+(?:by|at|to make|on time)|[?.!]|$)/i,
    /(?:how long|how far).*to\s+(.+?)(?:[?.!]|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

// Extract arrival time / buffer from query
export function extractArrivalInfo(text) {
  const bufferMatch = text.match(/(\d+)\s*(?:minutes?|mins?)\s*early/i);
  const bufferMins  = bufferMatch ? parseInt(bufferMatch[1]) : 0;

  const timeMatch = text.match(/(?:at|by|before|for)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let arrivalHour = null, arrivalMin = 0;
  if (timeMatch) {
    arrivalHour = parseInt(timeMatch[1]);
    arrivalMin  = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === 'pm' && arrivalHour < 12) arrivalHour += 12;
    if (meridiem === 'am' && arrivalHour === 12) arrivalHour = 0;
  }

  return { bufferMins, arrivalHour, arrivalMin };
}

// ── Main handler called from chat ────────────────────────────────────────────

export async function processCommuteQuery(text) {
  const destination = extractDestination(text);
  if (!destination) return null;

  const origin = await getSavedLocation();
  const { bufferMins, arrivalHour, arrivalMin } = extractArrivalInfo(text);

  if (!origin) {
    return `I don't have your location yet — allow it in Settings so I can estimate travel times.`;
  }

  const dest = await geocodeAddress(destination);
  if (dest) {
    const travelMins = await getTravelTime(origin, dest);
    if (travelMins !== null) {
      const totalMins = travelMins + bufferMins;
      const now       = new Date();
      let leaveBy     = null;

      if (arrivalHour !== null) {
        const arrival = new Date();
        arrival.setHours(arrivalHour, arrivalMin, 0, 0);
        if (arrival < now) arrival.setDate(arrival.getDate() + 1);
        leaveBy = new Date(arrival.getTime() - totalMins * 60000);
      }

      const travelStr = travelMins < 60
        ? `${travelMins} min`
        : `${Math.floor(travelMins / 60)}h ${travelMins % 60}m`;

      if (leaveBy) {
        const leaveStr = leaveBy.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return bufferMins > 0
          ? `Leave by ${leaveStr} — it's ${travelStr} to ${destination}${bufferMins ? `, plus ${bufferMins} min early` : ''}.`
          : `Leave by ${leaveStr} — it's about ${travelStr} to ${destination}.`;
      }

      return `It's about ${travelStr} to ${destination}.`;
    }
  }

  return `I can open Maps to ${destination} for you — just say "open maps to ${destination}".`;
}
