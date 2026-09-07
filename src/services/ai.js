import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Claude (Anthropic) ──────────────────────────────
const API_KEY_STORAGE = '@bloom_claude_key';
const AI_URL  = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-haiku-4-5-20251001';

// Built-in key baked in at build time via EXPO_PUBLIC_CLAUDE_KEY in .env.local
const DEFAULT_KEY = process.env.EXPO_PUBLIC_CLAUDE_KEY ?? '';

export async function getApiKey() {
  try {
    const stored = await AsyncStorage.getItem(API_KEY_STORAGE);
    return stored || DEFAULT_KEY || null;
  } catch {
    return DEFAULT_KEY || null;
  }
}

export async function saveApiKey(key) {
  try {
    if (key?.trim()) await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
    else await AsyncStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

// transcribeAudio is now handled by the Web Speech API in VoiceMicButton.
// This stub is kept so any leftover import doesn't crash.
export async function transcribeAudio() {
  throw new Error('Use Web Speech API via VoiceMicButton instead');
}

export async function callClaude({ system, messages, maxTokens = 600 }) {
  if (Platform.OS !== 'web') throw Object.assign(new Error('AI requires the web version.'), { code: 'PLATFORM' });
  const key = await getApiKey();
  if (!key) throw Object.assign(new Error('NO_KEY'), { code: 'NO_KEY' });

  // Anthropic message format: system is a top-level field, not part of messages
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: messages.filter(m => m.role !== 'system'),
  };
  if (system) body.system = system;

  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required to allow direct browser access
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message ?? `HTTP ${res.status}`;
    const code = (res.status === 401 || res.status === 403 || res.status === 402) ? 'AUTH' : 'API';
    throw Object.assign(new Error(msg), { code, status: res.status });
  }

  const data = await res.json();
  // Anthropic response: content[0].text
  const raw = data.content?.[0]?.text?.trim() ?? '';
  return stripMarkdown(raw);
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[*•\-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildBloomSystem({ userName, goals, tasks, ndToggles, checkIn }) {
  const name = userName || 'there';
  const pendingTasks = (tasks || []).filter(t => !t.done);
  const topTask = pendingTasks.find(t => t.priority === 'high') || pendingTasks[0];

  const taskSummary = pendingTasks.length > 0
    ? `Current tasks (${pendingTasks.length} pending): ${pendingTasks.slice(0, 6).map(t => `"${t.text}" [${t.priority}]`).join(', ')}${pendingTasks.length > 6 ? ` + ${pendingTasks.length - 6} more` : ''}`
    : 'No tasks yet.';

  const goalSummary = (goals || []).length > 0
    ? `Goals: ${goals.slice(0, 3).map(g => `"${g.text}"`).join(', ')}`
    : '';

  const moodLine = checkIn?.mood ? `User's mood today: ${checkIn.mood}.` : '';

  return `You are Bloom — a sharp, warm, zero-fluff productivity companion. You exist because ${name} keeps losing hours to scrolling. Your job is to redirect that energy into real progress.

RULES (absolute):
- Be specific. Reference EXACT tasks, EXACT goals, EXACT numbers from the context.
- Never use generic filler ("sounds great!", "I understand"). Every word earns its place.
- Keep responses SHORT: 2–4 sentences max for conversation; 3–6 steps max for how-to.
- Never use markdown formatting — no **bold**, no bullet points starting with -, no headers.
- No guilt, no shame, no streaks. Pure forward momentum.
- If someone dumps a list of tasks, acknowledge what you actually parsed specifically.

CONTEXT:
User: ${name}
${moodLine}
${taskSummary}
${goalSummary}
${topTask ? `Most pressing task: "${topTask.text}"` : ''}
${ndToggles?.dyslexia ? 'Note: user has dyslexia — keep sentences short and clear.' : ''}`;
}

// ─── Brain dump parser ───────────────────────────────
export async function parseBrainDump(text, userName, ndToggles, userOccupation) {
  const key = await getApiKey();
  if (!key) return parseBrainDumpLocal(text);

  const system = `You are Bloom's task parser. Extract every distinct actionable item from the user's message.

For each item, output a JSON object with:
- text: the task text (clean, concise, actionable — max 10 words)
- priority: "high" (urgent/deadline/health) | "medium" (regular work) | "low" (nice-to-have/leisure)
- category: "task" | "goal" (if it's large and not doable in one sitting, like "get fit" or "make $10k")
- buyReminder: if the task involves buying/ordering/picking up something, set this to a short note about when/where to buy (e.g. "Order online before Thursday" or "Pick up from pharmacy today") — otherwise null

Output ONLY a JSON object like:
{
  "items": [...],
  "response": "A warm 1-2 sentence reply that names 2-3 specific things you extracted, then says they're in their Today tab."
}

Do NOT add any text before or after the JSON.`;

  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!res.ok) return parseBrainDumpLocal(text);
    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() ?? '';
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return parseBrainDumpLocal(text);
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      items: (parsed.items || []).map((item, i) => ({
        id: Date.now() + i,
        text: item.text || '',
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        category: item.category === 'goal' ? 'goal' : 'task',
        buyReminder: item.buyReminder || null,
      })),
      response: parsed.response || null,
    };
  } catch {
    return parseBrainDumpLocal(text);
  }
}

function parseBrainDumpLocal(text) {
  // Naive split for when there's no API key
  const delimiters = /[,\n;]+/;
  const parts = text.split(delimiters).map(s => s.trim()).filter(s => s.length > 3 && s.length < 120);
  const items = parts.map((text, i) => ({
    id: Date.now() + i,
    text,
    priority: 'medium',
    category: 'task',
    buyReminder: null,
  }));
  return { items, response: null };
}

// ─── Goal action generator ───────────────────────────
export async function generateGoalAction({ goalText }) {
  const key = await getApiKey();
  if (!key) return `First step: break "${goalText}" into one small action you can do today.`;

  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 120,
        system: 'Generate a single concrete first action for a goal. One sentence, specific, doable today. No preamble, no markdown.',
        messages: [{ role: 'user', content: `Goal: "${goalText}"` }],
      }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? `Start by researching "${goalText}" for 15 minutes.`;
  } catch {
    return `Start by spending 15 minutes on "${goalText}" — just begin.`;
  }
}

// ─── Calendar event detector ─────────────────────────
export function detectCalendarAction(text) {
  const t = text.toLowerCase();
  return /\b(add|schedule|put|book|set up|create|remind me|block off)\b.*\b(event|meeting|appointment|call|session|class|lunch|dinner|coffee|date)\b/i.test(text)
    || /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)\b/i.test(t)
    || /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(t);
}
