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
  const goalList = goals?.length ? goals.map(g => g.text).join('; ') : 'none yet';
  const taskList = tasks?.filter(t => !t.done).slice(0, 6).map(t => `• ${t.text} [${t.priority}]`).join('\n') || 'none';
  return `You are Bloom, a calm and direct productivity assistant.
User: ${name}
Goals: ${goalList}
Pending tasks:\n${taskList}
Points: ${totalPoints ?? 0}

Be direct, warm, practical. 2–4 sentences unless asked for more.
Reference actual tasks and goals by name. Never use filler phrases. Never mention streaks.`;
}

// Parse brain dump → items + AI-generated personalised response
export async function parseBrainDump(rawText, userName = '') {
  const name = userName || 'the user';
  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');

    const reply = await callClaude({
      system: `Parse a free-form brain dump and generate a personalised Bloom response.
Return ONLY valid JSON (no markdown fences):
{
  "items": [{"text":"clean item","category":"task|goal|hobby","priority":"high|medium|low"}],
  "response": "Bloom's 2–3 sentence reply to ${name}"
}

Item rules:
- "goal": big life aspirations, career changes, financial targets, major milestones (start a business, write a book, move city, make £10k, become a doctor, run a marathon, buy a house)
- "hobby": creative or skill-building practice sessions (practice guitar, do yoga, paint something) — NOT buying supplies
- "task": everything else — errands, chores, appointments, schoolwork, buying things, communication
- Task priority: high=school/medical/urgent/overdue/bills, medium=errands/communication, low=leisure/fun/optional
- Hobbies: always priority "low"
- Goals: always priority "medium"
- Extract EVERY distinct item — never merge, never drop anything
- Rewrite each item's "text" as a short, clean imperative action label — strip filler words, first-person phrasing, and casual language. Title-case imperative style (e.g. "Take out the garbage" not "I really need to take out the garbage can"; "Write English essay outline" not "ugh i still haven't done my english essay outline")

Response rules (critical):
- Name 2–3 specific items from the dump using the user's own words
- If goals found, mention they've been added to Goals tab with a real plan
- Acknowledge emotional tone if evident (stressed, excited, overwhelmed)
- NEVER say "Here are your X tasks" or any generic opener
- 2–3 sentences, direct and warm`,
      messages: [{ role: 'user', content: rawText }],
      maxTokens: 1100,
    });

    const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.items)) throw new Error('bad format');
    return {
      items: parsed.items.filter(i => i.text && ['task', 'goal', 'hobby'].includes(i.category)),
      response: typeof parsed.response === 'string' ? parsed.response : null,
    };
  } catch {
    const items = _parseTasksFallback(rawText);
    return { items, response: _fallbackResponse(items) };
  }
}

function _parseTasksFallback(rawText) {
  const text = rawText.trim();
  let parts;
  if ((text.match(/,/g) || []).length >= 2) {
    parts = text.split(',').map(s => s.trim()).filter(s => s.length > 3);
  } else {
    parts = text.split(/[.!?\n;]+/).map(s => s.trim()).filter(s => s.length > 3);
  }

  const leadingVerb = /^(i need to|i want to|i gotta|i have to|i wanna|i must|need to|want to|have to|gotta)\s+/i;
  const items = [];

  for (let part of parts) {
    part = part.replace(/^[-•·*\d]+[.)]\s*/, '').replace(leadingVerb, '').trim();
    if (part.length < 4) continue;
    part = part.charAt(0).toUpperCase() + part.slice(1);
    const t = part.toLowerCase();

    let category = 'task';
    let priority = 'medium';

    if (/\b(become a|start a|launch|build a)\b/.test(t) ||
        /\b(make|earn|save)\b.{0,25}\b(\d+k|\d{4,}|thousand|million)\b/.test(t) ||
        /\b(write a book|get a degree|run a marathon|buy a house|buy a flat|move to)\b/.test(t)) {
      category = 'goal'; priority = 'medium';
    } else if (!/^(buy|purchase|get some|order|pick up)\b/.test(t) &&
               /\b(guitar|piano|violin|painting|drawing|watercolour|watercolor|yoga|meditation|running|jogging|cooking|photography|crochet|knitting|sewing)\b/.test(t)) {
      category = 'hobby'; priority = 'low';
    } else if (/\b(homework|essay|exam|test|quiz|doctor|dentist|appointment|urgent|deadline|overdue|pay|bill|prescription|medication)\b/.test(t)) {
      priority = 'high';
    } else if (/\b(watch|game|chill|relax|movie|show|youtube|scroll)\b/.test(t)) {
      priority = 'low';
    }

    items.push({ text: part, category, priority });
  }
  return items;
}

function _fallbackResponse(items) {
  if (items.length === 0) return "I didn't catch any tasks there — try listing them separated by commas.";
  const high = items.filter(i => i.priority === 'high' && i.category === 'task');
  const goals = items.filter(i => i.category === 'goal');
  const parts = [];
  if (high.length > 0) {
    parts.push(`Most important: ${high.slice(0, 2).map(t => `"${t.text}"`).join(' and ')}.`);
  } else {
    parts.push(`Got ${items.length} things sorted into your list.`);
  }
  if (goals.length > 0) parts.push(`"${goals[0].text}" looks like a big goal — added to your Goals tab with a first action.`);
  parts.push('Tap any task for step-by-step help.');
  return parts.join(' ');
}

// Generate a hobby milestone — first or next
export async function generateHobbyMilestone({ hobbyName, skillLevel = 'beginner', completedMilestones = [] }) {
  const isFirst = completedMilestones.length === 0;
  const system = `You generate one specific learning milestone for someone learning a hobby.
Requirements:
- Achievable in 1–3 practice sessions for a ${skillLevel} learner
- Ends with "done when…" — a concrete, testable completion criterion, not vague
- Most logical ${isFirst ? 'starting point' : 'next step'} given their progress
Write ONE milestone. 1–2 sentences. No numbering, no bullet points, no headers.`;

  const content = isFirst
    ? `Hobby: ${hobbyName}\nSkill level: ${skillLevel}`
    : `Hobby: ${hobbyName}\nSkill level: ${skillLevel}\nCompleted milestones:\n${completedMilestones.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;

  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');
    return (await callClaude({ system, messages: [{ role: 'user', content }], maxTokens: 200 })).trim();
  } catch {
    return _hobbyFallback(hobbyName, completedMilestones.length);
  }
}

function _hobbyFallback(hobbyName, stepIndex) {
  const h = hobbyName.toLowerCase();
  if (stepIndex === 0) {
    if (/guitar/.test(h)) return 'Learn the G, C, and D chord shapes — done when you can finger all three from memory without checking a diagram.';
    if (/piano|keyboard/.test(h)) return 'Learn the names of all white keys in one octave — done when you can name any key instantly without counting from C.';
    if (/paint|watercolou?r|acrylic/.test(h)) return 'Practice a flat colour wash across a full page — done when the colour is even with no visible streaks or hard edges.';
    if (/draw|sketch/.test(h)) return 'Draw 5 basic 3D shapes from memory (cube, sphere, cone, cylinder, pyramid) — done when each is clearly recognisable without a reference.';
    if (/run|jog/.test(h)) return 'Run continuously for 10 minutes — done when you complete the full time at any pace without stopping.';
    if (/yoga/.test(h)) return "Hold 5 foundational poses (mountain, warrior I, downward dog, child's pose, corpse) for 30 seconds each — done when you can flow through all 5 without a guide.";
    if (/cook|bak/.test(h)) return 'Cook one complete meal from scratch using only a recipe — done when the meal is edible and you made every component yourself.';
    if (/crochet|knit/.test(h)) return "Complete a 4-inch swatch using a basic stitch — done when the rows are even and you haven't dropped any stitches.";
    if (/photograph/.test(h)) return 'Take 10 photos where you consciously chose what to include in the frame — done when you have 10 intentional shots, not snapshots.';
    if (/meditat/.test(h)) return 'Sit quietly and focus on your breath for 5 minutes — done when the timer goes off and you stayed seated the whole time.';
    return `Spend 20 focused minutes on ${hobbyName} and complete one small specific exercise — done when you can describe exactly what you practised.`;
  }
  if (stepIndex === 1) return `Build on your ${hobbyName} foundation: practise the core technique for 30 minutes focusing on one weak area — done when you can repeat it consistently 3 times in a row.`;
  return `Challenge yourself with a harder aspect of ${hobbyName} — done when you finish one mini-project or exercise that felt difficult at the start but manageable by the end.`;
}

// Generate a goal action — first or next
export async function generateGoalAction({ goalText, completedActions = [] }) {
  const isFirst = completedActions.length === 0;
  const system = `You generate one specific next action for someone working toward a goal.
Requirements:
- Completable today or this week
- Specific and concrete — not "research" but "open X and find Y and write down Z"
- Most logical ${isFirst ? 'first step to get started' : 'next step given progress so far'}
- Takes 30 minutes to 2 hours
Write ONE action. 1–2 sentences. No bullet points.`;

  const content = isFirst
    ? `Goal: ${goalText}`
    : `Goal: ${goalText}\nCompleted actions:\n${completedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\nWhat's next?`;

  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');
    return (await callClaude({ system, messages: [{ role: 'user', content }], maxTokens: 200 })).trim();
  } catch {
    return _goalFallback(goalText, completedActions.length);
  }
}

function _goalFallback(goalText, stepIndex) {
  const t = goalText.toLowerCase();
  if (stepIndex === 0) {
    if (/money|earn|income|business|sell/.test(t)) return "Write down 3 realistic ways to earn money toward this goal, pick the one requiring the least startup cost, and list exactly what you'd need to begin.";
    if (/fit|run|gym|weight|health/.test(t)) return 'Do 10 minutes of movement right now — done when 10 minutes is up.';
    if (/learn|study|language|skill|code|programming/.test(t)) return 'Find one free resource for this topic and complete the very first lesson today.';
    if (/write|book|blog|publish/.test(t)) return 'Write 200 words on this topic right now without stopping to edit — done when you hit 200 words.';
    if (/travel|move|abroad/.test(t)) return 'Look up the full cost (transport, accommodation, daily budget) and write down real numbers — done when you have actual figures written out.';
    if (/save|invest|financial/.test(t)) return "Open your bank app and calculate exactly how much you'd need to save per week to hit this goal by year end — write the number down.";
    return `Write exactly what "done" looks like for this goal in specific, measurable terms — done when you have a clear finish line written out.`;
  }
  return `Identify the single biggest obstacle blocking progress on "${goalText}" right now, and write one concrete action that would directly reduce or remove it.`;
}

// Generate a screen awareness insight from usage data
export async function generateScreenInsight({ screenTime, unlocks, hobbies = [] }) {
  const hobbyList = hobbies.length ? hobbies.join(', ') : 'none yet';
  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');
    return (await callClaude({
      system: "Write one specific, observational sentence about this person's screen time data. Be direct and specific to the numbers. Not preachy, no generic 'try to use your phone less' advice.",
      messages: [{ role: 'user', content: `Screen time: ${screenTime}\nUnlocks: ${unlocks}\nUser's hobbies: ${hobbyList}` }],
      maxTokens: 80,
    })).trim();
  } catch {
    const hour = new Date().getHours();
    if (hour >= 20) return 'Evenings tend to be peak scroll time — 30 minutes of phone-free wind-down makes a measurable difference to sleep quality.';
    if (typeof unlocks === 'number' && unlocks > 15) return `${unlocks} unlocks today — that's an interruption every few minutes. Batching checks to once an hour dramatically reduces the mental cost.`;
    return 'Noticing your patterns is the most useful first step — most people underestimate their daily screen time by 40%.';
  }
}
