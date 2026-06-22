import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_KEY_STORAGE = '@bloom_anthropic_key';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export async function getApiKey() {
  try { return await AsyncStorage.getItem(API_KEY_STORAGE); }
  catch { return null; }
}

export async function saveApiKey(key) {
  try {
    if (key?.trim()) await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
    else await AsyncStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

export async function callClaude({ system, messages, maxTokens = 600 }) {
  if (Platform.OS !== 'web') throw Object.assign(new Error('AI requires the web version.'), { code: 'PLATFORM' });

  const key = await getApiKey();
  if (!key) throw Object.assign(new Error('NO_KEY'), { code: 'NO_KEY' });

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const code = res.status === 401 ? 'AUTH' : 'API';
    throw Object.assign(new Error(err.error?.message ?? `HTTP ${res.status}`), { code });
  }

  const data = await res.json();
  return data.content[0]?.text ?? '';
}

export function buildBloomSystem({ userName, buddy, goals, tasks, streak, totalPoints, momentum }) {
  const name = userName || 'there';
  const buddyName = buddy?.name || 'Bloom';
  const goalList = goals?.length ? goals.map(g => g.text).join('; ') : 'none set yet';
  const taskList = tasks?.filter(t => !t.done).slice(0, 6).map(t => `• ${t.text} [${t.priority}]`).join('\n') || 'none';

  return `You are ${buddyName}, a warm, direct productivity companion inside the Bloom app.

About the user:
- Name: ${name}
- Year goal(s): ${goalList}
- Today's pending tasks:\n${taskList}
- Current streak: ${streak ?? 0} days
- Total points: ${totalPoints ?? 0}  |  Momentum: ${momentum ?? 0}%

Personality: Supportive but honest. Practical, not fluffy. Keep replies to 2–4 sentences unless the user clearly wants more.
Reference their actual tasks and goals when it's natural. If they seem overwhelmed, help them choose ONE thing.
Never use hollow phrases like "Great question!" or "Absolutely!".`;
}

export async function parseTasksWithAI(rawText) {
  const reply = await callClaude({
    system: `You convert brain-dump text into a prioritised task list.
Return ONLY a JSON array — no markdown, no explanation.
Schema: [{"text": "Task description", "priority": "high"|"medium"|"low"}]
Priority: high = urgent/deadline/appointment/call/email today; low = maybe/eventually/someday; medium = everything else.
Clean text: fix capitalisation, trim filler, keep each item concise. Merge duplicates.`,
    messages: [{ role: 'user', content: rawText }],
    maxTokens: 900,
  });

  const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) throw new Error('Bad format');
  return parsed.filter(t => t.text && ['high', 'medium', 'low'].includes(t.priority));
}

export async function generateGoalAdvice(goalText) {
  const reply = await callClaude({
    system: `You give specific, actionable advice for personal goals. Return ONLY JSON — no markdown.
Schema: {"nudge": "one specific sentence (not generic)", "step": "the single most important next action", "links": "Resource: url  ·  Resource: url  ·  Resource: url"}
Use real, accurate URLs relevant to the exact goal described.`,
    messages: [{ role: 'user', content: `My goal: ${goalText}` }],
    maxTokens: 400,
  });

  const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}

export async function generateDailyNudge({ userName, goals, tasks, streak, momentum }) {
  const name = userName || 'there';
  const goal = goals?.[0]?.text || '';
  const pendingCount = tasks?.filter(t => !t.done).length ?? 0;

  const reply = await callClaude({
    system: 'You write short, personal daily nudges for a productivity app. One or two sentences. Direct and warm, not generic.',
    messages: [{
      role: 'user',
      content: `User: ${name}. Streak: ${streak} days. Momentum: ${momentum}%. Pending tasks: ${pendingCount}. Goal: ${goal || 'none'}. Write today's nudge.`,
    }],
    maxTokens: 120,
  });

  return reply.trim();
}
