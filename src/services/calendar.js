import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { callClaude, getApiKey } from './ai';

const CLIENT_ID_KEY    = '@bloom_gcal_client_id';
const TOKEN_KEY        = '@bloom_gcal_token';
const TOKEN_EXPIRY_KEY = '@bloom_gcal_expiry';
const CALENDAR_API     = 'https://www.googleapis.com/calendar/v3';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

// --- Storage helpers ---

export async function getCalendarClientId() {
  try { return await AsyncStorage.getItem(CLIENT_ID_KEY); }
  catch { return null; }
}

export async function saveCalendarClientId(id) {
  try {
    if (id?.trim()) await AsyncStorage.setItem(CLIENT_ID_KEY, id.trim());
    else await AsyncStorage.removeItem(CLIENT_ID_KEY);
  } catch {}
}

export async function getCalendarToken() {
  try {
    const token  = await AsyncStorage.getItem(TOKEN_KEY);
    const expiry = parseInt((await AsyncStorage.getItem(TOKEN_EXPIRY_KEY)) ?? '0');
    if (!token || Date.now() > expiry - 60000) return null;
    return token;
  } catch { return null; }
}

export async function saveCalendarToken(token, expiry) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
  } catch {}
}

export async function clearCalendarToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {}
}

export async function isCalendarConnected() {
  return !!(await getCalendarToken());
}

// --- OAuth (Google implicit flow for web SPA) ---

function getRedirectUri() {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return origin + pathname.replace(/\/?$/, '/');
}

export async function startCalendarOAuth() {
  if (Platform.OS !== 'web') throw new Error('Calendar requires the web version of Bloom.');
  const clientId = await getCalendarClientId();
  if (!clientId) throw new Error('No Client ID saved — enter your Google Client ID first.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Call once on app startup — extracts token from URL hash if this is an OAuth redirect.
// Returns the token data if found, null otherwise.
export function extractTokenFromHash() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.includes('access_token=')) return null;
  const params    = new URLSearchParams(hash.substring(1));
  const token     = params.get('access_token');
  const expiresIn = parseInt(params.get('expires_in') ?? '3600');
  if (!token) return null;
  window.history.replaceState(null, '', window.location.pathname);
  return { token, expiry: Date.now() + expiresIn * 1000 };
}

// --- Google Calendar REST API ---

async function calFetch(path, options = {}) {
  const token = await getCalendarToken();
  if (!token) throw Object.assign(new Error('Calendar not connected'), { code: 'NO_CAL_AUTH' });
  const res = await fetch(`${CALENDAR_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw Object.assign(new Error('Google Calendar session expired — reconnect in the Calendar tab.'), { code: 'NO_CAL_AUTH' });
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
}

export async function getUpcomingEvents(daysAhead = 14) {
  const now    = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(), timeMax: future.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
  });
  const data = await calFetch(`/calendars/primary/events?${params}`);
  return data?.items ?? [];
}

export async function getEventsForPeriod(start, end) {
  const params = new URLSearchParams({
    timeMin: start.toISOString(), timeMax: end.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '100',
  });
  const data = await calFetch(`/calendars/primary/events?${params}`);
  return data?.items ?? [];
}

export async function createCalendarEvent({ summary, startDateTime, endDateTime, description = '' }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return calFetch('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify({
      summary, description,
      start: { dateTime: startDateTime, timeZone: tz },
      end:   { dateTime: endDateTime,   timeZone: tz },
    }),
  });
}

export async function updateCalendarEvent({ eventId, summary, startDateTime, endDateTime, description }) {
  const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body = {};
  if (summary     !== undefined) body.summary     = summary;
  if (description !== undefined) body.description = description;
  if (startDateTime) body.start = { dateTime: startDateTime, timeZone: tz };
  if (endDateTime)   body.end   = { dateTime: endDateTime,   timeZone: tz };
  return calFetch(`/calendars/primary/events/${eventId}`, {
    method: 'PATCH', body: JSON.stringify(body),
  });
}

export async function deleteCalendarEvent(eventId) {
  return calFetch(`/calendars/primary/events/${eventId}`, { method: 'DELETE' });
}

// --- High-level request handler (called from chat) ---

function formatEventTime(event) {
  if (event.start.dateTime) {
    const dt = new Date(event.start.dateTime);
    return dt.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return event.start.date;
}

function buildEndTime(startDateTime, durationMinutes = 60) {
  const end = new Date(new Date(startDateTime).getTime() + durationMinutes * 60000);
  return end.toISOString().replace('Z', '+00:00');
}

function buildStartDateTime(dateISO, timeISO) {
  const [h, m] = (timeISO ?? '09:00').split(':').map(Number);
  const d = new Date(dateISO + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d.toISOString().replace('Z', '+00:00');
}

export async function processCalendarRequest(text) {
  const connected = await isCalendarConnected();
  if (!connected) {
    const aiKey = await getApiKey();
    if (aiKey) {
      const now = new Date();
      return await callClaude({
        system: `You are Bloom, a personal productivity assistant. Today is ${now.toDateString()}. The user is asking about their schedule but Google Calendar isn't connected, so you don't have their actual events. Help them think through their scheduling question, suggest a plan, or offer time management advice based on what they said. Be warm and specific. 2-3 sentences.`,
        messages: [{ role: 'user', content: text }],
        maxTokens: 200,
      }).catch(() => "I can help you think through your schedule — just tell me what you're working with and I'll help you plan it out.");
    }
    return "I can help you think through your schedule — just tell me what you're working with and I'll help you plan it out.";
  }

  // Parse intent with AI
  let intent = { action: 'none' };
  try {
    const aiKey = await getApiKey();
    if (aiKey) {
      const now = new Date();
      const reply = await callClaude({
        system: `You extract structured calendar actions from natural language. Today is ${now.toDateString()} (${now.toISOString().slice(0,10)}).

Return ONLY valid JSON:
{
  "action": "create|list|update|delete|query|none",
  "summary": "event title",
  "dateISO": "YYYY-MM-DD or null",
  "timeISO": "HH:MM (24h) or null",
  "durationMinutes": 60,
  "queryStart": "ISO datetime or null",
  "queryEnd": "ISO datetime or null",
  "searchQuery": "event name keywords for update/delete or null",
  "needsClarification": "question to ask user if ambiguous, otherwise null"
}

Rules:
- For "next Tuesday", compute the actual calendar date relative to today
- "this week" = Monday to Sunday of current week
- "tomorrow" = today + 1 day
- "this afternoon" = 12:00–17:00, "this morning" = 08:00–12:00, "this evening" = 17:00–21:00
- If date/time is genuinely ambiguous (two possible Tuesdays, no time given for a meeting), set needsClarification
- Duration defaults to 60 minutes unless specified`,
        messages: [{ role: 'user', content: text }],
        maxTokens: 300,
      });
      const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      intent = JSON.parse(clean);
    }
  } catch { intent = { action: 'none' }; }

  if (intent.action === 'none') return null;

  if (intent.needsClarification) return intent.needsClarification;

  try {
    // --- CREATE ---
    if (intent.action === 'create') {
      if (!intent.dateISO) return "I need a date for that event — when should I add it?";
      const startDT = buildStartDateTime(intent.dateISO, intent.timeISO);
      const endDT   = buildEndTime(startDT, intent.durationMinutes ?? 60);
      const created = await createCalendarEvent({
        summary: intent.summary ?? 'New event',
        startDateTime: startDT,
        endDateTime: endDT,
      });
      const dateStr = new Date(startDT).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      const timeStr = intent.timeISO
        ? new Date(startDT).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : 'all day';
      const aiKey = await getApiKey();
      if (aiKey) {
        return await callClaude({
          system: 'Confirm a calendar event was created. 1 sentence, warm and specific. Include the event name, date and time exactly.',
          messages: [{ role: 'user', content: `Created: "${created.summary}" on ${dateStr} at ${timeStr}` }],
          maxTokens: 80,
        }).catch(() => `Done! Added "${created.summary}" to your calendar for ${dateStr} at ${timeStr}.`);
      }
      return `Done! Added "${created.summary}" to your calendar for ${dateStr} at ${timeStr}.`;
    }

    // --- LIST / QUERY ---
    if (intent.action === 'list' || intent.action === 'query') {
      const start  = intent.queryStart ? new Date(intent.queryStart) : new Date();
      const end    = intent.queryEnd   ? new Date(intent.queryEnd)   : new Date(Date.now() + 7 * 86400000);
      const events = await getEventsForPeriod(start, end);
      const summary = events.length === 0
        ? 'No events found.'
        : events.map(e => `${formatEventTime(e)}: ${e.summary}`).join('\n');
      const aiKey = await getApiKey();
      if (aiKey) {
        return await callClaude({
          system: 'You are Bloom. Answer the user\'s calendar question using their actual events. Be specific. 2–3 sentences.',
          messages: [{ role: 'user', content: `Question: "${text}"\nCalendar events:\n${summary}` }],
          maxTokens: 200,
        }).catch(() => events.length === 0 ? 'Nothing scheduled for that period.' : `You have ${events.length} event${events.length > 1 ? 's' : ''}: ${events.map(e => e.summary).join(', ')}.`);
      }
      return events.length === 0 ? 'Nothing scheduled for that period.' : summary;
    }

    // --- UPDATE ---
    if (intent.action === 'update') {
      const events = await getUpcomingEvents(30);
      const query  = (intent.searchQuery ?? intent.summary ?? '').toLowerCase();
      const match  = events.find(e => e.summary?.toLowerCase().includes(query));
      if (!match) return `I couldn't find "${intent.searchQuery ?? intent.summary}" in your upcoming events. Can you be more specific?`;

      const origDate = (match.start.dateTime ?? match.start.date ?? '').substring(0, 10);
      let startDT, endDT;
      if (intent.timeISO && origDate) {
        startDT = buildStartDateTime(origDate, intent.timeISO);
        const origDuration = match.start.dateTime && match.end?.dateTime
          ? new Date(match.end.dateTime) - new Date(match.start.dateTime)
          : 3600000;
        endDT = new Date(new Date(startDT).getTime() + origDuration).toISOString().replace('Z', '+00:00');
      }
      const updated = await updateCalendarEvent({ eventId: match.id, summary: intent.summary, startDT, endDT });
      const timeStr = startDT
        ? new Date(startDT).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : undefined;
      return timeStr
        ? `Done — "${updated?.summary ?? match.summary}" has been moved to ${timeStr}.`
        : `Done — "${updated?.summary ?? match.summary}" has been updated.`;
    }

    // --- DELETE ---
    if (intent.action === 'delete') {
      const events = await getUpcomingEvents(30);
      const query  = (intent.searchQuery ?? intent.summary ?? '').toLowerCase();
      const match  = events.find(e => e.summary?.toLowerCase().includes(query));
      if (!match) return `I couldn't find "${intent.searchQuery ?? intent.summary}" in your upcoming events.`;
      await deleteCalendarEvent(match.id);
      return `Done — "${match.summary}" has been removed from your calendar.`;
    }

    return null;
  } catch (e) {
    if (e.code === 'NO_CAL_AUTH') return e.message;
    return `I couldn't update your calendar: ${e.message}. Please try again.`;
  }
}
