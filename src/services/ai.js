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
function splitIntoItems(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();

  // Hard splits: newlines, semicolons, periods, ! ?
  const hardChunks = text.split(/[.!?\n;]+/).map(s => s.trim()).filter(Boolean);

  const result = [];
  for (const chunk of hardChunks) {
    if (chunk.length < 4) continue;

    // Find positions where a new task starts mid-sentence (no punctuation)
    // e.g. "finish my painting I have to go to the doctor"
    const boundaryRe = /\b(I (?:wanna|want to|wanted to|need to|needed to|have to|gotta|got to|should|must|plan to|am going to|will)|also (?:I |need|want)|oh (?:and|also)\s)/gi;
    const matches = [...chunk.matchAll(boundaryRe)];
    const boundaries = matches.map(m => m.index).filter(idx => idx > 3);

    if (boundaries.length === 0) {
      result.push(chunk);
      continue;
    }

    let prev = 0;
    for (const b of boundaries) {
      const part = chunk.slice(prev, b).trim();
      if (part.length > 4) result.push(part);
      prev = b;
    }
    const last = chunk.slice(prev).trim();
    if (last.length > 4) result.push(last);
  }

  return result
    .map(s => s.trim().replace(/^[-•·*\d.]+\s*/, '').trim())
    .filter(s => s.length > 4 && !isNoise(s));
}

function isNoise(text) {
  const t = text.toLowerCase().trim();
  // Filter pure connectives and meta-commentary about the app
  if (/^(and|but|so|also|then|like|um|uh|oh|okay|ok|right|yeah|yes|no|the|a|an)$/.test(t)) return true;
  if (/\b(api key|anthropic|settings|this app|bloom said|you said|i said|i was saying|i mentioned)\b/.test(t)) return true;
  if (t.length < 5) return true;
  return false;
}

function getPriority(text) {
  const t = text.toLowerCase();

  // HIGH: school, health, money obligations, explicit urgency
  if (/\b(homework|essay|assignment|exam|test|quiz|report|school|class|teacher|professor|due|submit|hand in|turn in|study for|revision)\b/.test(t)) return 'high';
  if (/\b(doctor|dentist|hospital|appointment|clinic|therapy|therapist|prescription|medicine|medication)\b/.test(t)) return 'high';
  if (/\b(urgent|asap|right now|today|tonight|this morning|deadline|overdue|late|emergency|must|have to|critical)\b/.test(t)) return 'high';
  if (/\b(pay|bill|rent|bank|taxes|fine|owe)\b/.test(t)) return 'high';

  // LOW: leisure, creative fun, personal care, aspirational
  if (/\b(paint (my|nails)|nail|nails|hair|makeup|beauty|spa|treat myself|pamper)\b/.test(t)) return 'low';
  if (/\b(game|games|gaming|play|hang out|chill|relax|watch|movie|show|youtube|tiktok|instagram|scroll)\b/.test(t)) return 'low';
  if (/\b(dream|design my dream|someday|eventually|one day|when i can|if i have time)\b/.test(t)) return 'low';
  if (/\b(maybe|might|could|would love to|i'd like to|i wanna|want to try)\b/.test(t)) return 'low';

  // MEDIUM: chores, errands, communication (default)
  return 'medium';
}

function categoriseWithRules(rawText) {
  const items = splitIntoItems(rawText);

  return items.map(text => {
    const t = text.toLowerCase();
    let category = 'task';
    let priority = 'medium';

    // Goals: big life aspirations or financial targets
    if (
      /\b(become a|start a|launch a|build a|grow a|open a|create a)\b/.test(t) ||
      /\b(make|earn|save|hit|reach)\b.{0,20}\b(\d+k|\d{4,}|\d+ (grand|thousand|million))\b/.test(t) ||
      /\b(write a book|publish|get a degree|move to|buy a (house|flat|car|home)|run a marathon|get into|be accepted|learn .{3,15} fluently|quit my job|start my own)\b/.test(t) ||
      /\bdesign (my |a )?dream (home|house|room|life)\b/.test(t)
    ) {
      category = 'goal';
    }
    // Hobbies: creative or skill-building for personal growth/joy
    else if (
      /\b(guitar|piano|violin|drums|singing|dancing|paint(ing)?|draw(ing)?|sketch(ing)?|meditat(e|ion|ing)|yoga|bak(e|ing)|garden(ing)?|knit(ting)?|sew(ing)?|crochet|craft(ing)?|photograph(y|ing)|sculpt(ing)?|pottery|ceramics)\b/.test(t) ||
      /\b(finish|continue|work on|practice) (my |the |a )?(painting|drawing|sketch|watercolou?r|canvas|portrait|landscape|art|music|song|piece)\b/.test(t) ||
      /\bpractice (my |the )?(guitar|piano|violin|singing|dancing|art)\b/.test(t)
    ) {
      category = 'hobby';
    }

    if (category === 'task') {
      priority = getPriority(t);
    }

    return {
      text: text.charAt(0).toUpperCase() + text.slice(1),
      category,
      priority,
    };
  }).filter(i => i.text.length > 4);
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
