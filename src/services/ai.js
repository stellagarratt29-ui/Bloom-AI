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

export function buildBloomSystem({ userName, goals, tasks, totalPoints }) {
  const name = userName || 'there';
  const goalList = goals?.length ? goals.map(g => g.text).join('; ') : 'none set yet';
  const taskList = tasks?.filter(t => !t.done).slice(0, 6).map(t => `• ${t.text} [${t.priority}]`).join('\n') || 'none';

  return `You are Bloom, a calm and direct AI productivity assistant for a personal productivity app.

About the user:
- Name: ${name}
- Year goals: ${goalList}
- Today's pending tasks:\n${taskList}
- Total points earned: ${totalPoints ?? 0}

Personality: Direct, warm, practical. Keep replies to 2–4 sentences unless asked for more.
Reference their actual tasks and goals naturally. If overwhelmed, help them pick ONE thing.
Never use filler phrases like "Great question!" or "Absolutely!".
Never show streaks or mention streaks — they don't exist in this app.`;
}

// ----- Rule-based parser — works without an API key -----

function splitIntoItems(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();

  // Strip common leading preambles
  const stripped = text
    .replace(/^(ok(ay)?[,\s]+so[,\s]+|so[,\s]+here'?s?[,\s]+|right[,\s]+so[,\s]+|alright[,\s]+|basically[,\s]+)/i, '')
    .trim();

  // Hard splits: newlines, semicolons, sentence-ending punctuation
  const hardChunks = stripped
    .split(/[.!?\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const result = [];

  for (const chunk of hardChunks) {
    // Comma-separated list detection: 2+ commas = treat as a list
    const commaCount = (chunk.match(/,/g) || []).length;

    if (commaCount >= 2) {
      const parts = chunk
        .split(',')
        .map(s => s.trim().replace(/^(and|also|then|plus)\s+/i, '').trim())
        .filter(s => s.length > 3);
      result.push(...parts);
      continue;
    }

    // Mid-sentence boundary detection for flowing text without commas
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

  // Strip leading "i need to", "i want to" etc. from each item
  const leadingVerb = /^(i need to|i want to|i gotta|i have to|i wanna|i must|i will|i should|i'll|i'm going to|need to|want to|have to|gotta|must)\s+/i;

  return result
    .map(s => s.trim()
      .replace(/^[-•·*\d]+[.)]\s*/, '')
      .replace(leadingVerb, '')
      .trim()
    )
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .filter(s => s.length > 4 && !isNoise(s));
}

function isNoise(text) {
  const t = text.toLowerCase().trim();
  if (/^(and|but|so|also|then|like|um|uh|oh|okay|ok|right|yeah|yes|no|the|a|an)$/.test(t)) return true;
  if (/\b(api key|anthropic|settings|this app|bloom said|you said|i said|i was saying|i mentioned)\b/.test(t)) return true;
  if (t.length < 5) return true;
  return false;
}

function getPriority(text) {
  const t = text.toLowerCase();

  if (/\b(homework|essay|assignment|exam|test|quiz|report|school|class|teacher|professor|due|submit|hand in|turn in|study for|revise|revision)\b/.test(t)) return 'high';
  if (/\b(doctor|dentist|hospital|appointment|clinic|therapy|therapist|prescription|medicine|medication|appt?)\b/.test(t)) return 'high';
  if (/\b(urgent|asap|right now|today|tonight|this morning|deadline|overdue|late|emergency|must|critical)\b/.test(t)) return 'high';
  if (/\b(pay|bill|rent|bank|taxes|fine|owe)\b/.test(t)) return 'high';

  if (/\b(paint (my|nails)|nail|nails|hair|makeup|beauty|spa|treat myself|pamper)\b/.test(t)) return 'low';
  if (/\b(game|games|gaming|play|hang out|chill|relax|watch|movie|show|youtube|tiktok|instagram|scroll|browse|pinterest)\b/.test(t)) return 'low';
  if (/\b(dream|design my dream|someday|eventually|one day|when i can|if i have time)\b/.test(t)) return 'low';
  if (/\b(maybe|might|would love to|i'd like to)\b/.test(t)) return 'low';

  return 'medium';
}

function categoriseWithRules(rawText) {
  const items = splitIntoItems(rawText);

  return items.map(text => {
    const t = text.toLowerCase();
    let category = 'task';
    let priority = 'medium';

    // Goals: big life aspirations, financial targets, major milestones
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
      /\b(guitar|piano|violin|drums|singing|dancing|watercolou?r|meditat(e|ion|ing)|yoga|bak(e|ing)|garden(ing)?|knit(ting)?|sew(ing)?|crochet|craft(ing)?|photograph(y|ing)|sculpt(ing)?|pottery|ceramics)\b/.test(t) ||
      /\b(finish|continue|work on|practice) (my |the |a )?(painting|drawing|sketch|watercolou?r|canvas|portrait|landscape|art|music|song|piece)\b/.test(t) ||
      /\bpractice (my |the )?(guitar|piano|violin|singing|dancing|art)\b/.test(t)
    ) {
      category = 'hobby';
    }

    if (category === 'task') {
      priority = getPriority(t);
    } else if (category === 'hobby') {
      // Hobbies go to Fun & Leisure
      priority = 'low';
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

  try {
    const reply = await callClaude({
      system: `You categorise a brain dump into goals, tasks, and hobbies.
Return ONLY a JSON array — no markdown, no explanation.
Schema: [{"text": "clean item text", "category": "task"|"goal"|"hobby", "priority": "high"|"medium"|"low"}]

Rules:
- "goal": big life aspirations, financial targets, career changes, major milestones (make 10k, start a business, write a book, move city, get a degree)
- "hobby": creative or skill-building done for personal growth/joy (paint, guitar, yoga, journalling, cooking, reading)
- "task": specific to-dos, errands, appointments, work items (email someone, call doctor, finish report, buy groceries)
- priority applies to tasks: high=urgent/school/health, medium=errands/communication, low=leisure/fun
- hobbies always get priority "low"
Clean up text: fix capitalisation, trim filler words, keep each item concise.
Extract EVERY distinct item — do not merge or drop anything.`,
      messages: [{ role: 'user', content: rawText }],
      maxTokens: 900,
    });

    const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error('Bad format');
    return parsed.filter(i => i.text && ['task', 'goal', 'hobby'].includes(i.category));
  } catch {
    return categoriseWithRules(rawText);
  }
}

export async function generateDailyNudge({ userName, goals, tasks }) {
  const name = userName || 'there';
  const goal = goals?.[0]?.text || '';
  const pendingCount = tasks?.filter(t => !t.done).length ?? 0;

  const reply = await callClaude({
    system: 'You write short, personal daily nudges for a productivity app. One or two sentences. Direct and warm, not generic.',
    messages: [{
      role: 'user',
      content: `User: ${name}. Pending tasks: ${pendingCount}. Goal: ${goal || 'none'}. Write today\'s nudge.`,
    }],
    maxTokens: 120,
  });

  return reply.trim();
}
