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

export function buildBloomSystem({ userName, goals, tasks, streak, totalPoints, momentum }) {
  const name = userName || 'there';
  const goalList = goals?.length ? goals.map(g => g.text).join('; ') : 'none set yet';
  const taskList = tasks?.filter(t => !t.done).slice(0, 6).map(t => `• ${t.text} [${t.priority}]`).join('\n') || 'none';

  return `You are Bloom, a calm and direct AI productivity assistant.

About the user:
- Name: ${name}
- Year goals: ${goalList}
- Today's pending tasks:\n${taskList}
- Streak: ${streak ?? 0} days  |  Points: ${totalPoints ?? 0}  |  Momentum: ${momentum ?? 0}%

Personality: Direct, warm, practical. Keep replies to 2–4 sentences unless asked for more.
Reference their actual tasks and goals naturally. If overwhelmed, help them pick ONE thing.
Never use filler phrases like "Great question!" or "Absolutely!".`;
}

// Rule-based categoriser — works without an API key
function categoriseWithRules(rawText) {
  const lines = rawText
    .split(/[\n;]|\band\b/gi)
    .flatMap(c => c.split(/[.!?]+/))
    .map(s => s.trim().replace(/^[-•·*\d.]+\s*/, ''))
    .filter(s => s.length > 2);

  return lines.map(text => {
    const t = text.toLowerCase();
    let category = 'task';
    let priority = 'medium';

    // Goals: big aspirations, financial targets, major life changes
    if (
      /\b(become a|start a|launch a|build a|grow a|open a)\b/.test(t) ||
      /\b(make|earn|save|hit)\b.*\b(\d+k|\d+ (grand|thousand|million))\b/.test(t) ||
      /\b(write a book|publish|get a degree|move to|buy a (house|flat|car)|run a marathon|learn .+fluent|quit my job|start my own)\b/.test(t)
    ) {
      category = 'goal';
    }
    // Hobbies: creative or skill-building activities done for personal growth
    else if (
      /\b(guitar|piano|violin|drums|singing|dancing|paint(ing)?|draw(ing)?|sketch(ing)?|journal(ling|ing)?|meditat(e|ion|ing)|yoga|cook(ing)?|bak(e|ing)|garden(ing)?|knit(ting)?|sew(ing)?|crochet|craft(ing)?|photograph(y|ing)|sculpt(ing)?|pottery|ceramics|creative writing|reading for fun)\b/.test(t) ||
      /\bwork on (my |the )?(painting|drawing|music|song|novel|blog|art|portfolio|book)\b/.test(t) ||
      /\bpractice (my |the )?(guitar|piano|violin|singing|dancing|art|drawing)\b/.test(t)
    ) {
      category = 'hobby';
    }

    // Priority for tasks only
    if (category === 'task') {
      if (/\b(urgent|important|must|asap|today|due|deadline|overdue|critical|need to|have to|got to|right away)\b/i.test(t)) priority = 'high';
      else if (/\b(maybe|could|eventually|later|sometime|want to|might|would love|one day|when i can)\b/i.test(t)) priority = 'low';
    }

    return {
      text: text.charAt(0).toUpperCase() + text.slice(1),
      category,
      priority,
    };
  }).filter(i => i.text.length > 2);
}

// Parses brain dump → [{text, category: 'task'|'goal'|'hobby', priority}]
export async function parseTasksWithAI(rawText) {
  const key = await getApiKey();
  if (!key) return categoriseWithRules(rawText);

  const reply = await callClaude({
    system: `You categorise a brain dump into goals, tasks, and hobbies.
Return ONLY a JSON array — no markdown, no explanation.
Schema: [{"text": "clean item text", "category": "task"|"goal"|"hobby", "priority": "high"|"medium"|"low"}]

Rules:
- "goal": big life aspirations, financial targets, career changes, major milestones (make 10k, start a business, write a book, move city, get a degree)
- "hobby": creative or skill-building done for personal growth/joy (paint, guitar, yoga, journalling, cooking, reading)
- "task": specific to-dos, errands, appointments, work items (email someone, call doctor, finish report, buy groceries)
- priority applies mainly to tasks: high=urgent/today, medium=this week, low=someday/maybe
Clean up text: fix capitalisation, trim filler words, keep each item concise.`,
    messages: [{ role: 'user', content: rawText }],
    maxTokens: 900,
  });

  const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) throw new Error('Bad format');
  return parsed.filter(i => i.text && ['task', 'goal', 'hobby'].includes(i.category));
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
