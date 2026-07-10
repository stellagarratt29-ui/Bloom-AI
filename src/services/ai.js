import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_KEY_STORAGE = '@bloom_ai_key';
const AI_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL    = 'llama-3.1-8b-instant';

// Default key embedded at build time — set EXPO_PUBLIC_GROQ_KEY in .env.local
// so users don't need to enter their own key.
const DEFAULT_KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';

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

export async function transcribeAudio(audioBlob) {
  const key = await getApiKey();
  if (!key) throw Object.assign(new Error('NO_KEY'), { code: 'NO_KEY' });

  // Determine file extension from MIME type
  const mime = audioBlob.type || 'audio/webm';
  const ext  = mime.includes('mp4') || mime.includes('m4a') ? 'm4a'
             : mime.includes('ogg') ? 'ogg'
             : mime.includes('wav') ? 'wav'
             : 'webm';

  const form = new FormData();
  form.append('file', audioBlob, `audio.${ext}`);
  form.append('model', 'whisper-large-v3');

  const res = await fetch(AUDIO_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const data = await res.json();
  return (data.text ?? '').trim();
}

export async function callClaude({ system, messages, maxTokens = 600 }) {
  if (Platform.OS !== 'web') throw Object.assign(new Error('AI requires the web version.'), { code: 'PLATFORM' });
  const key = await getApiKey();
  if (!key) throw Object.assign(new Error('NO_KEY'), { code: 'NO_KEY' });

  const allMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages,
  ];

  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages: allMessages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message ?? `HTTP ${res.status}`;
    const code = (res.status === 401 || res.status === 403 || res.status === 402) ? 'AUTH' : 'API';
    throw Object.assign(new Error(msg), { code, status: res.status });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  return stripMarkdown(raw);
}

// Strip markdown that React Native Text can't render
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/^[*•\-]\s+/gm, '')        // bullet points
    .replace(/^\d+\.\s+/gm, '')         // numbered lists
    .replace(/#{1,6}\s+/g, '')           // headings
    .replace(/`(.+?)`/g, '$1')           // inline code
    .replace(/\n{3,}/g, '\n\n')          // triple+ newlines
    .trim();
}

export function buildBloomSystem({ userName, goals, tasks, ndToggles, checkIn }) {
  const name = userName || 'there';
  const goalList = goals?.length ? goals.map(g => g.text).join('; ') : 'none yet';
  const taskList = tasks?.filter(t => !t.done).slice(0, 6).map(t => `• ${t.text} [${t.priority}]`).join('\n') || 'none';
  let extra = '';
  if (ndToggles?.gentlerLanguage) {
    extra += '\nAlways use the gentlest possible language — never imply failure, never say "you didn\'t finish". When something isn\'t done, frame it as "that\'s okay, here\'s what\'s next."';
  }
  if (ndToggles?.timeBuffers) {
    extra += '\nWhen estimating time for tasks, always suggest 50–100% more time than the absolute minimum — err generously.';
  }
  return `You are Bloom, a calm and direct productivity assistant.
User: ${name}
Goals: ${goalList}
Pending tasks:\n${taskList}

Be direct, warm, practical. 2–4 sentences unless asked for more.
Reference actual tasks and goals by name. Never use filler phrases. Never mention streaks.${checkIn ? `\nUser's check-in today — mood: ${checkIn.mood}, sleep: ${checkIn.sleep}, energy: ${checkIn.energy}. Let this subtly shape your tone: if they're tired/low energy, suggest smaller steps; if overwhelmed/stressed, be extra gentle; if great/high energy, be more ambitious.` : ''}${extra}`;
}

// Parse brain dump → items + AI-generated personalised response
export async function parseBrainDump(rawText, userName = '', ndToggles = {}, userOccupation = '') {
  const name = userName || 'the user';
  const autoBreak = ndToggles?.autoBreakTasks;
  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');

    const reply = await callClaude({
      system: `You are a task parser. Parse a free-form brain dump into clean task cards.
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "items": [{"text":"short label","category":"task|goal|hobby","priority":"high|medium|low"}],
  "response": "Bloom's reply to ${name}"
}

═══ LABEL RULES (most important — read carefully) ═══
Every "text" must be a SHORT ACTION LABEL: 3–7 words maximum.
NEVER copy the user's sentence. ALWAYS rewrite as a short imperative.
Start with a strong verb. Remove all filler, commentary, first-person, and reasoning.

TRANSFORMATION EXAMPLES — always do this:
"The baby has a checkup today, I think it's today, let me check — yeah it's today, it's in forty minutes, phenomenal"
→ "Baby checkup today"

"Cancel a subscription I forgot I had, it just charged me again for the third month in a row"
→ "Cancel forgotten subscription"

"There's a field trip form that needs a check attached, physical check, who has checks, where are my checks"
→ "Find checks for field trip form"

"Call my mom back, she's called four times, I love her, I'm avoiding her"
→ "Call mom back"

"So I woke up to a text from the HOA, apparently our sprinklers were running at 2am, great, cool, no idea how"
→ "Fix HOA sprinkler issue"

"I have to empty the refrigerator out at 3 o'clock"
→ "Empty fridge at 3pm"

"I've been meaning to get back to Sarah about the dinner thing"
→ "Reply to Sarah about dinner"

═══ CATEGORY RULES ═══
- "goal": big life aspirations (start a business, get a degree, run a marathon, make £10k, buy a house)
- "hobby": creative/skill practice (practice guitar, do yoga, paint) — NOT buying supplies
- "task": everything else — errands, chores, appointments, schoolwork, communication, bills
- Extract EVERY distinct action — never merge, never drop, never duplicate
${autoBreak ? '- For each task, if it can logically split into 2–3 concrete steps, return each step as its own item with the same priority.' : ''}

═══ PRIORITY RULES — follow exactly ═══
These map directly to the 3 sections the user sees:
  high   → top priority section
  medium → TASKS section
  low    → FUN & LEISURE section

User occupation: ${userOccupation || 'not specified'}

high (top priority — only these things):
${userOccupation === 'Working' ? '- Work: deadlines, client deliverables, urgent work tasks, job interviews, performance reviews' : ''}
${userOccupation === 'Student' || !userOccupation ? '- School: homework, essays, exams, tests, assignments, school events (bake sale, field trips)' : ''}
${userOccupation === 'Both' ? '- Work deadlines, client deliverables\n- School: homework, essays, exams, tests, school events' : ''}
- Health: doctor, dentist, nurse, hospital, prescriptions, medication, therapy
- Urgent/overdue: overdue bills, emergencies

medium (everything else — most tasks go here):
- Chores: laundry, cleaning, cooking, dishes, taking out trash
- Daily routines: getting dressed, walking the dog, feeding pets
- Errands: shopping, picking up, dropping off, returns
- Social: calling people back, apologizing, RSVPs
- Admin: scheduling, booking, rescheduling, emails, forms

low: hobbies, fun, leisure, optional, nice-to-haves

EXAMPLES:
"Doctor appointment" → high | "Call school nurse" → high | "Submit essay" → high
"Do laundry" → medium | "Let dog out" → medium | "Get dressed" → medium
"Order gift" → medium | "Apologize to neighbor" → medium | "Reschedule electrician" → medium
"Watch a movie" → low | "Practice guitar" → low

═══ RESPONSE RULES ═══
- 2–3 sentences, warm and direct
- Name 2–3 specific things from the dump
- If goals found, mention they're in the Goals tab
- Acknowledge stress/overwhelm if present
- NEVER start with "Here are your X tasks"`,
      messages: [{ role: 'user', content: rawText }],
      maxTokens: 1100,
    });

    const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.items)) throw new Error('bad format');

    const seen = new Set();
    const STRIP_LEAD = /^(?:i\s+(?:need\s+to|have\s+to|gotta|want\s+to|should|must|will)\s+)+/i;
    const items = parsed.items
      .filter(i => i.text && ['task', 'goal', 'hobby'].includes(i.category))
      .map(i => {
        let t = i.text.trim().replace(STRIP_LEAD, '');
        // Truncate labels that are clearly still full sentences (>50 chars, >8 words)
        const words = t.split(/\s+/);
        if (words.length > 8) t = words.slice(0, 6).join(' ');
        t = t.charAt(0).toUpperCase() + t.slice(1);
        return { ...i, text: t };
      })
      .filter(i => {
        const key = i.text.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return i.text.length >= 3;
      });

    return {
      items,
      response: typeof parsed.response === 'string' ? parsed.response : null,
    };
  } catch {
    const items = _parseTasksFallback(rawText);
    return { items, response: _fallbackResponse(items) };
  }
}

function _parseTasksFallback(rawText) {
  const text = rawText.trim();

  // Never a task — filler words/phrases matched exactly
  const FILLER = /^(okay|ok|sure|fine|right|alright|yeah|yep|nope|hmm|ugh|oh|well|anyway|so|actually|basically|literally|honestly|seriously|lol|fresh chaos|here we go|not sure|maybe|probably|got it|sounds good|perfect|great|nice|cool|thanks|thank you|bye|hi|hey|hello|i see|i know|no worries|no problem)\.?!?\s*$/i;

  // Sentence endings that signal an incomplete fragment — never a task
  const DANGLING_END = /\b(which|that|but|and|or|though|although|because|since|if|when|where|who|whom|whose|—)\s*\.?\s*$/i;

  // Clear action verbs — required for narrative sentences to qualify as tasks
  const HAS_ACTION = /\b(call|email|text|ring|contact|message|reach out|find|look for|locate|get|buy|purchase|pick up|order|grab|fetch|drop off|take|bring|deliver|return|exchange|check|fix|repair|replace|sort|handle|deal with|go|visit|meet|attend|pay|book|schedule|cancel|confirm|reschedule|send|write|finish|complete|clean|tidy|wash|cook|make|prepare|print|scan|upload|download|install|update|review|read|listen|practice|study|research|look up|renew|apply|register|enroll|follow up|respond|reply|RSVP|remind|organise|organize|arrange|plan|set up|speak to|talk to|collect|measure|run|submit|fill|sign|clear|pack|unpack|feed|water|walk|take out|empty|figure out|work on|start|begin|wrap up|open|turn off|turn on|charge|cut|trim|mow|track|confirm|sort out|pick up|drop|bring|grab)\b/i;

  // Extract real tasks embedded in narrative sentences
  const NARRATIVE_EXTRACTIONS = [
    // "I've got a dentist thing for somebody today"
    { re: /\bi'?ve?\s+got\s+(?:a\s+|an\s+)?(.{4,60}?)(?:\s+(?:for|with)\s+\S+(?:\s+\S+)?)?(?:\s+(?:today|tomorrow|this\s+\w+))?\s*(?:[.!?,]|$)/i, fn: m => m[1].trim() },
    // "gotta find my keys" / "need to email the tutor" / "have to RSVP"
    { re: /\b(?:i\s+)?(?:gotta|need\s+to|have\s+to|must|should)\s+(.{4,70}?)(?:\s*[.!?,]|\s+(?:today|soon|now|tonight|this\s+week|this\s+month)\b|\s*$)/i, fn: m => m[1].trim() },
    // "dryer's making that smell" / "washer is making a noise"
    { re: /\b(dryer|washer|dishwasher|oven|fridge|refrigerator|boiler|heating|a\/c|heater|cooker)\b.{0,50}(?:smell|noise|sound|making|broken?|not\s+working|acting\s+up|weird)/i, fn: m => `Check ${m[1]}`, priority: 'medium' },
    // "deadline's today" / "deadline is this week"
    { re: /\bdeadline\b.{0,50}(?:today|tonight|tomorrow|soon|this\s+week|this\s+morning|due)/i, fn: () => 'Check deadline — something is due today', priority: 'high' },
  ];

  const commaCount = (text.match(/,/g) || []).length;
  const commaParts = text.split(',').map(s => s.trim()).filter(s => s.length > 2);
  // Structured list: commas present AND every part is short (real items, not embedded sentences)
  const isStructuredList = commaCount >= 2 && commaParts.every(p => p.split(/\s+/).length <= 10);

  const items = [];
  const seen = new Set();
  const LEAD_STRIP = /^(?:[-•·*\d]+[.)]\s*|(?:i need to|i want to|i gotta|i have to|i wanna|i must|need to|want to|have to|gotta|also|and|but|plus|or|first off|oh and)\s+)+/gi;

  const addItem = (rawText, overridePriority) => {
    let clean = rawText.replace(LEAD_STRIP, '').trim();
    if (clean.length < 4) return;
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const t = clean.toLowerCase();
    let category = 'task';
    let priority = overridePriority || 'medium';

    if (!overridePriority) {
      // high = ONLY school/health/medical/urgent — nothing else
      if (/\b(homework|essay|exam|test|quiz|doctor|dentist|nurse|hospital|clinic|appointment|deadline|urgent|overdue|bill|prescription|medication|school nurse|bake sale|field trip form)\b/i.test(t)) priority = 'high';
      else if (/\b(watch|game|chill|relax|movie|show|youtube|scroll|fun|party|hang out)\b/i.test(t)) priority = 'low';
      // everything else (chores, errands, daily routines) stays medium
    }
    if (/\b(become a|start a|launch|build a)\b/.test(t) ||
        /\b(make|earn|save)\b.{0,25}\b(\d+k|\d{4,}|thousand|million)\b/.test(t) ||
        /\b(write a book|get a degree|run a marathon|buy a house|buy a flat|move to)\b/.test(t)) {
      category = 'goal'; priority = 'medium';
    } else if (!/^(buy|purchase|get some|order|pick up)\b/.test(t) &&
               /\b(guitar|piano|violin|painting|drawing|watercolour|watercolor|yoga|meditation|running|jogging|cooking|photography|crochet|knitting|sewing)\b/.test(t)) {
      category = 'hobby'; priority = 'low';
    }
    items.push({ text: clean, category, priority });
  };

  if (isStructuredList) {
    // Comma-separated list: split and filter, keep almost everything
    for (let part of commaParts) {
      part = part.replace(LEAD_STRIP, '').trim();
      if (part.length < 4 || FILLER.test(part)) continue;
      addItem(part);
    }
  } else {
    // Narrative text: two-pass approach

    // Pass 1 — pattern-based extraction (catches tasks embedded in sentences)
    for (const { re, fn, priority } of NARRATIVE_EXTRACTIONS) {
      const m = text.match(re);
      if (m) {
        const taskText = fn(m);
        if (taskText && taskText.length > 3) addItem(taskText, priority);
      }
    }

    // Pass 2 — sentence-by-sentence, require clear action verb
    const sentences = text.split(/(?:[.!?]|\s—\s)\s+/).map(s => s.trim()).filter(s => s.length > 3);
    for (let part of sentences) {
      if (FILLER.test(part.toLowerCase())) continue;          // "Okay", "Sure", "Fine"
      if (DANGLING_END.test(part)) continue;                  // "They were in the fruit bowl yesterday which"
      if (!HAS_ACTION.test(part)) continue;                   // no verb → skip narrative context
      // Skip if already captured by extraction patterns
      const stripped = part.replace(LEAD_STRIP, '').trim().toLowerCase();
      if (seen.has(stripped)) continue;
      addItem(part);
    }
  }

  return items;
}

function _fallbackResponse(items) {
  if (items.length === 0) return "I can see there's a lot going on — but I need an AI connection to untangle a message like this properly. Add a Claude API key in Settings and I'll sort it. Or try listing your tasks separated by commas.";
  const high = items.filter(i => i.priority === 'high' && i.category === 'task');
  const goals = items.filter(i => i.category === 'goal');
  const parts = [];
  if (high.length > 0) {
    parts.push(`Most important: ${high.slice(0, 2).map(t => `"${t.text}"`).join(' and ')}.`);
  } else {
    parts.push(`Got ${items.length} thing${items.length !== 1 ? 's' : ''} sorted into your list.`);
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
  const system = `You generate one gentle, achievable next action for someone working toward a goal.
Requirements:
- As small and frictionless as possible — ideally under 10 minutes
- Uses simple tools only: phone alarm, pen and paper, a quick search, a voice note — NEVER suggest spreadsheets, apps to install, or complex tracking systems
- ${isFirst ? 'The tiniest possible first step — so easy it feels almost too simple' : 'The next natural step given what they have already done'}
- Written for a busy person who might be a parent, has limited time, and needs to feel a small win quickly
- Specific and concrete — not "research X" but "take out your phone and set a reminder for X tonight"
Write ONE action. 1–2 sentences. No bullet points. No overwhelm.`;

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
    if (/sleep|rest|tired|bedtime/.test(t)) return "Set a bedtime alarm on your phone for 30 minutes earlier than usual tonight — done when the alarm is set.";
    if (/money|earn|income|business|sell/.test(t)) return "Grab a piece of paper and write down one realistic way you could work toward this — don't overthink it, one idea is enough to start.";
    if (/fit|run|gym|weight|health/.test(t)) return "Put on your shoes right now and step outside for 5 minutes — done when you get back through the door.";
    if (/learn|study|language|skill|code|programming/.test(t)) return "Search for one beginner video on this topic and watch the first 5 minutes — done when you press play.";
    if (/write|book|blog|publish/.test(t)) return "Set a 5-minute timer and write whatever comes to mind about this topic — stop when the timer goes off.";
    if (/travel|move|abroad/.test(t)) return "Send yourself a voice note describing what this trip looks like in your head — done when you've recorded it.";
    if (/save|invest|financial/.test(t)) return "Open your banking app and check your current balance — done once you know the number you're starting from.";
    return "Take 2 minutes right now to write down what this goal means to you in one sentence — done when it's written somewhere you can see it.";
  }
  return `Think of the smallest possible next thing you could do today for "${goalText}" and do just that — even 5 minutes of progress counts.`;
}

// Quick regex check — is this message likely a calendar action?
export function detectCalendarAction(text) {
  const t = text.toLowerCase();
  if (/\b(add|put|schedule|book|create|set up|block off)\b.{0,60}(calendar|diary|appointment|meeting|event|\bat \d|\b(?:tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|this morning|this afternoon|this evening))/i.test(t)) return true;
  if (/\b(what (?:do i have|am i doing|'?s on)|do i have (?:anything|events?)|am i (?:free|busy|available)|(?:my |the |this )?(?:calendar|schedule|diary))\b/.test(t)) return true;
  if (/\b(move|reschedule|change|postpone|cancel|delete|remove)\b.{0,60}\b(appointment|meeting|event|session)\b/i.test(t)) return true;
  return false;
}

// Generate a FULL hobby curriculum — all milestones at once
export async function generateHobbyCurriculum({ hobbyName, skillLevel = 'beginner' }) {
  const system = `You generate a complete, research-backed learning curriculum for someone starting a hobby.

Return ONLY valid JSON (no markdown fences):
{"milestones": ["milestone 1 text", "milestone 2 text", ...]}

Requirements:
- 6–8 milestones in genuine pedagogical order — the exact sequence a skilled teacher would use
- Each milestone: 1–2 sentences. Starts with an action verb. Ends with "done when…" and a specific, testable completion criterion
- Grounded in how this skill is actually taught — not busywork or arbitrary placeholders
- Each step builds directly on the previous one
- First milestone must be achievable in a single 30–60 minute session

Quality standard your output must match:

Guitar (beginner):
- "Learn to hold the guitar correctly and tune it using a tuner app — done when the guitar is in tune and your fretting arm feels relaxed."
- "Learn the G, C, D, and Em chord shapes — done when you can finger all four from memory without checking a diagram."
- "Practice switching cleanly between G and C 10 times — done when both chords ring clearly with no muted strings or pauses."
- "Learn a basic down-strum pattern on one chord — done when you keep a steady beat for 30 seconds without stopping."
- "Combine chord switching with strumming across G–C–D–Em — done when you play through all four without stopping."
- "Learn one complete simple song using G, C, D, Em — done when you can play it start to finish at a slow, consistent tempo."

Watercolor (beginner):
- "Set up your palette and paint a colour chart — done when you have a labelled dry swatch of every colour on paper."
- "Practice a flat wash — done when you can pull one smooth, streak-free band of colour across a full page."
- "Practice a graded wash (light to dark) — done when you can transition from pale to saturated in one continuous stroke."
- "Practice wet-on-wet: drop paint onto wet paper — done when you've filled a page with blooms and noted how it differs from painting on dry paper."
- "Plan your whites before painting — done when you've sketched a simple subject and marked all areas that must stay paper-white."
- "Paint one simple finished subject using big shapes first — done when you have one small completed piece (a leaf, fruit, or single flower)."

Reason about how ${hobbyName} is genuinely taught and sequence accordingly.`;

  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');
    const reply = await callClaude({
      system,
      messages: [{ role: 'user', content: `Hobby: ${hobbyName}\nSkill level: ${skillLevel}` }],
      maxTokens: 900,
    });
    const clean = reply.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.milestones) || parsed.milestones.length === 0) throw new Error('bad format');
    return parsed.milestones;
  } catch {
    return _curriculumFallback(hobbyName);
  }
}

function _curriculumFallback(hobbyName) {
  const h = hobbyName.toLowerCase();
  if (/guitar/.test(h)) return [
    'Learn to hold the guitar correctly and tune it using a tuner app — done when the guitar is in tune and your fretting arm feels relaxed.',
    'Learn the G, C, D, and Em chord shapes — done when you can finger all four from memory without checking a diagram.',
    'Practice switching between G and C 10 times each direction — done when both chords ring clearly with no muted strings.',
    'Learn a basic down-strum pattern on a single chord — done when you keep a steady beat for 30 seconds without stopping.',
    'Combine chord switching with strumming across G–C–D–Em — done when you play through all four without stopping.',
    'Learn one complete simple song using G, C, D, Em — done when you can play it start to finish at a slow, consistent tempo.',
  ];
  if (/watercolou?r|watercolor/.test(h)) return [
    'Set up your palette and paint a colour chart — done when you have a labelled dry swatch of every colour on paper.',
    'Practice a flat wash — done when you can pull one smooth, streak-free band of colour across a full page.',
    'Practice a graded wash — done when you can transition from pale to saturated in one continuous stroke.',
    "Practice wet-on-wet: drop paint onto wet paper and let it bloom — done when you've filled a page with blooms.",
    'Plan your whites before painting — done when you\'ve marked all areas that must stay paper-white on a sketch.',
    'Paint one simple finished subject using big shapes first — done when you have one small completed piece.',
    'Paint a slightly more complex piece with 2–3 elements — done when it\'s finished and you can name one improvement from last time.',
  ];
  if (/piano|keyboard/.test(h)) return [
    'Learn the names of all white keys in one octave — done when you can name any key instantly without counting from C.',
    'Play the C major scale up and down with correct finger numbers — done when you can play it smoothly 5 times in a row.',
    'Play "Twinkle Twinkle Little Star" with the right hand from memory — done when you can play it without stopping.',
    'Learn to play C, F, and G as left-hand single bass notes — done when you can hit each on cue without looking.',
    'Combine right-hand melody with left-hand bass on a simple song — done when both hands play together without stopping.',
    'Learn the C major chord with your left hand — done when you can hold and release it cleanly 10 times.',
  ];
  if (/draw|sketch/.test(h)) return [
    'Draw the 5 basic 3D forms from memory (cube, sphere, cylinder, cone, pyramid) — done when all five are clearly recognisable.',
    'Do 5 gesture drawings of a simple pose, 2 minutes each — done when you can capture the main line of action in each.',
    'Draw one household object from direct observation — done when the proportions are roughly accurate.',
    'Shade a sphere using cross-hatching to show a clear light source — done when the sphere reads as 3D.',
    'Draw a still life of 2–3 objects from observation, including basic shading — done when the composition is complete.',
    'Draw one portrait study from a photo — done when the major proportions are in approximately correct relation.',
  ];
  if (/run|jog/.test(h)) return [
    'Complete a 20-minute brisk walk — done when you finish the full 20 minutes without stopping.',
    'Complete run/walk intervals: 1 min run, 2 min walk, repeat 6 times — done when you finish all 18 minutes.',
    'Run continuously for 10 minutes — done when you finish the full 10 minutes at any pace.',
    'Run continuously for 20 minutes — done when you finish without stopping.',
    'Run a 5K distance at any pace — done when the full 5K is complete.',
    'Run a 5K in under 40 minutes — done when your timer confirms the time.',
  ];
  if (/cook|bak/.test(h)) return [
    'Cook one simple dish from scratch following a recipe exactly — done when the dish is edible and every component is homemade.',
    'Practice sautéing: cook onions and garlic to a consistent golden colour — done when the result is even, not burnt.',
    'Cook a dish using two different techniques (e.g. sauté + simmer) — done when the dish is finished and edible.',
    'Cook one dish from memory without checking a recipe — done when you complete it successfully.',
    'Cook a complete three-component meal (protein, carb, vegetable) where all three are ready to serve at the same time.',
    'Cook the same dish twice in one week and improve one specific aspect each time — done when you can name what improved.',
  ];
  return [
    `Learn the fundamental setup and safety rules for ${hobbyName} — done when you can describe the 3 most important things a beginner must know.`,
    `Practice the most basic technique in ${hobbyName} for 30 minutes — done when you can perform it once correctly from start to finish.`,
    `Repeat the core technique 20 times in one session focusing on consistency — done when at least 15 of 20 repetitions feel controlled.`,
    `Complete one small finished project using everything learned so far — done when the project is done and you can name one thing you'd improve.`,
    `Try a harder variation of the main technique — done when you complete it, even imperfectly.`,
    `Create one piece of work in ${hobbyName} you're proud enough to share — done when it's finished and you've shown it to at least one person.`,
  ];
}

// Generate a warm yearly review reflection
export async function generateYearReview({ year, taskCount, hobbies = [], goals = [] }) {
  const hobbyList = hobbies.map(h => `${h.name} (milestone ${(h.milestoneIndex ?? 0) + 1} of ${h.milestones?.length || 1})`).join(', ') || 'none';
  const goalList  = goals.map(g => `${g.text} (${g.completedActions?.length || 0} actions done)`).join(', ') || 'none';
  try {
    const key = await getApiKey();
    if (!key) throw new Error('no key');
    return (await callClaude({
      system: 'Write one warm, specific, encouraging sentence (max 35 words) about this person\'s year. Reference real numbers and names. Never use generic filler like "great job" or "you should be proud". Be direct and specific.',
      messages: [{ role: 'user', content: `Year: ${year}\nTasks completed: ${taskCount}\nHobbies: ${hobbyList}\nGoals: ${goalList}` }],
      maxTokens: 90,
    })).trim();
  } catch {
    if (hobbies.length > 0 && taskCount > 0)
      return `${taskCount} task${taskCount !== 1 ? 's' : ''} done and ${hobbies.length} skill${hobbies.length !== 1 ? 's' : ''} in progress — ${hobbies[0].name} shows real, steady commitment.`;
    if (taskCount > 0)
      return `${taskCount} task${taskCount !== 1 ? 's' : ''} ticked off — real, consistent effort across the year.`;
    if (hobbies.length > 0)
      return `${hobbies[0].name} is a skill that takes patience — getting started is its own achievement.`;
    return `Getting started and making a plan — that's what ${year} looks like from here.`;
  }
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
