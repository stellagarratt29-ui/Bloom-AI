// Google OAuth (popup, implicit flow) + Calendar API
// Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env.local
// Also add redirect URI https://stellagarratt29-ui.github.io/Bloom-AI/ to your Google OAuth credentials

const CLIENT_ID   = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CAL_API     = 'https://www.googleapis.com/calendar/v3';
const SCOPES      = 'email profile https://www.googleapis.com/auth/calendar.readonly';
const SESSION_KEY = '@bloom_gauth';

// In-memory state (restored from sessionStorage on load)
let _token    = null;
let _user     = null;   // { name, email, picture }
let _tokenExp = 0;

export function hasClientId()  { return !!CLIENT_ID; }
export function isSignedIn()   { return !!_token && Date.now() < _tokenExp; }
export function getGoogleUser(){ return _user; }

/** Call once at app start to restore a previous session */
export function restoreGoogleSession() {
  try {
    const raw = typeof window !== 'undefined' && window.sessionStorage?.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s.token || Date.now() >= s.exp) return false;
    _token    = s.token;
    _user     = s.user;
    _tokenExp = s.exp;
    return true;
  } catch { return false; }
}

/** Open Google OAuth popup. Resolves with user info, rejects on cancel/error. */
export function signInWithGoogle() {
  if (!CLIENT_ID) return Promise.reject(Object.assign(new Error('NO_CLIENT_ID'), { code: 'NO_CLIENT_ID' }));

  return new Promise((resolve, reject) => {
    const redirectUri = window.location.origin + window.location.pathname.replace(/index\.html$/, '');
    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  redirectUri,
      response_type: 'token',
      scope:         SCOPES,
      prompt:        'select_account',
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-oauth',
      'width=480,height=600,left=200,top=80,resizable=yes'
    );

    if (!popup) { reject(new Error('Popup blocked — allow popups for this site')); return; }

    const interval = setInterval(async () => {
      try {
        if (popup.closed) { clearInterval(interval); reject(new Error('Cancelled')); return; }
        const href = popup.location.href;
        if (!href.includes(window.location.origin)) return; // Still on Google's domain

        popup.close();
        clearInterval(interval);

        const hash = new URL(href).hash.replace(/^#/, '');
        const p    = new URLSearchParams(hash);
        const token = p.get('access_token');
        if (!token) { reject(new Error('No token returned')); return; }

        const expiresIn = parseInt(p.get('expires_in') ?? '3600', 10);
        _token    = token;
        _tokenExp = Date.now() + expiresIn * 1000;

        // Fetch user profile
        const uRes  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const uData = await uRes.json();
        _user = { name: uData.name ?? '', email: uData.email ?? '', picture: uData.picture ?? '' };

        // Persist to sessionStorage (cleared when browser closes)
        try {
          window.sessionStorage?.setItem(SESSION_KEY, JSON.stringify({ token, user: _user, exp: _tokenExp }));
        } catch {}

        resolve(_user);
      } catch (_e) {
        // Cross-origin errors while popup is still on Google's domain — ignore
        if (popup.closed) { clearInterval(interval); reject(new Error('Cancelled')); }
      }
    }, 500);
  });
}

export function signOutGoogle() {
  _token    = null;
  _user     = null;
  _tokenExp = 0;
  try { window.sessionStorage?.removeItem(SESSION_KEY); } catch {}
}

/** Fetch today's events from Google Calendar */
export async function fetchTodayEvents() {
  if (!isSignedIn()) return [];
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  try {
    const res = await fetch(
      `${CAL_API}/calendars/primary/events?` + new URLSearchParams({
        timeMin:       start,
        timeMax:       end,
        singleEvents:  'true',
        orderBy:       'startTime',
        maxResults:    '25',
      }),
      { headers: { Authorization: `Bearer ${_token}` } }
    );
    if (!res.ok) {
      if (res.status === 401) signOutGoogle();
      return [];
    }
    const data = await res.json();
    return (data.items ?? [])
      .filter(ev => ev.status !== 'cancelled')
      .map(ev => ({
        id:     ev.id,
        title:  ev.summary ?? 'Event',
        start:  ev.start?.dateTime ?? ev.start?.date ?? '',
        end:    ev.end?.dateTime   ?? ev.end?.date   ?? '',
        allDay: !ev.start?.dateTime,
      }));
  } catch { return []; }
}

/** Fetch events for a given YYYY-MM-DD date */
export async function fetchEventsForDate(dateStr) {
  if (!isSignedIn()) return [];
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

  try {
    const res = await fetch(
      `${CAL_API}/calendars/primary/events?` + new URLSearchParams({
        timeMin: start, timeMax: end, singleEvents: 'true', orderBy: 'startTime', maxResults: '25',
      }),
      { headers: { Authorization: `Bearer ${_token}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? [])
      .filter(ev => ev.status !== 'cancelled')
      .map(ev => ({
        id: ev.id, title: ev.summary ?? 'Event',
        start: ev.start?.dateTime ?? ev.start?.date ?? '',
        end:   ev.end?.dateTime   ?? ev.end?.date   ?? '',
        allDay: !ev.start?.dateTime,
      }));
  } catch { return []; }
}
