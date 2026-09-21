import { Platform } from 'react-native';

// ─── Groq (free, fast, Llama) ────────────────────────
const AI_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL  = 'llama-3.3-70b-versatile';
const KEY    = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';

// ─── Core call ───────────────────────────────────────
async function callGroq({ system, messages, maxTokens = 600 }) {
  if (Platform.OS !== 'web') throw Object.assign(new Error('AI requires the web version.'), { code: 'PLATFORM' });
  if (!KEY) throw Object.assign(new Error('NO_KEY'), { code: 'NO_KEY' });

  const msgs = [];
  if (system) msgs.push({ role: 'system', content: system });
  msgs.push(...messages.filter(m => m.role !== 'system'));

  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: msgs }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message ?? `HTTP ${res.status}`;
    const code = (res.status === 401 || res.status === 403) ? 'AUTH' : 'API';
    throw Object.assign(new Error(msg), { code, status: res.status });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  return stripMarkdown(raw);
}

// Export alias so existing imports don't break
export async function callClaude(opts) { return callGroq(opts); }

// No-op stubs kept so nothing crashes
export async function getApiKey()      { return KEY || null; }
export async function saveApiKey()     {}
export async function transcribeAudio() { throw new Error('Use Web Speech API via VoiceMicButton instead'); }

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

// ─── System prompt builder ───────────────────────────
export function buildBloomSystem({ userName, tasks, lifeProjects, ndToggles, checkIn }) {
  const name = userName || 'there';
  const pendingTasks = (tasks || []).filter(t => !t.done);
  const urgentTasks  = pendingTasks.filter(t => (t.urgency ?? 'whenever') === 'tonight');
  const topTask = urgentTasks[0] || pendingTasks[0];

  const taskSummary = pendingTasks.length > 0
    ? `Tasks (${pendingTasks.length} pending): ${pendingTasks.slice(0, 6).map(t => `"${t.text}" [${t.urgency ?? t.priority}]`).join(', ')}${pendingTasks.length > 6 ? ` +${pendingTasks.length - 6} more` : ''}`
    : 'No tasks yet.';

  const projectSummary = (lifeProjects || []).length > 0
    ? `Life projects: ${lifeProjects.slice(0, 4).map(p => `"${p.name}"`).join(', ')}`
    : '';

  return `You are Bloom — a sharp, warm personal assistant for ${name}. You help them think clearly and make progress, like a smart friend who listens properly.

STRICT RULES:
- Sound like a real person texting a friend. Never like an app or assistant.
- Be specific. Always reference exact task names, exact things they mentioned.
- Keep it SHORT: 2–3 sentences max for chat, 4–6 sentences max for how-to advice.
- No markdown. No bullet points. No bold. No headers. Plain sentences only.
- No guilt, no "you should", no "don't forget". Just forward momentum.
- If they ask about skin, hair, wardrobe, fitness — give real, specific, knowledgeable advice grounded in actual science or technique. Not generic tips.
- If they mention feeling overwhelmed or stressed, acknowledge it briefly then pivot to one concrete small action.

CONTEXT:
${name ? `Name: ${name}` : ''}
${taskSummary}
${projectSummary}
${topTask ? `Most urgent right now: "${topTask.text}"` : ''}
${checkIn?.mood ? `Mood today: ${checkIn.mood}` : ''}`;
}

// ─── Brain dump parser ───────────────────────────────
export async function parseBrainDump(text) {
  if (!KEY) return parseBrainDumpLocal(text);

  const system = `You are Bloom — a sharp, warm personal assistant. Read the user's brain dump and extract EVERY separate item.

Classify each as a TASK or LIFE PROJECT:

TASK — something with a clear end state (do homework, wash leotard, make cookies, reply to email):
- text: short, actionable, max 8 words — keep the specific detail (e.g. "Wash leotard before Saturday" not just "Wash leotard")
- urgency: "tonight" (due today, urgent, must happen), "thisweek" (this week, soon but not urgent), or "whenever" (no time pressure)
- Extract EVERY separate task. Never merge two tasks into one. If they mention 7 things, output 7 tasks.

LIFE PROJECT — ongoing area with no single endpoint (skin, hair, wardrobe, ongoing health issue, learning something, long-term project):
- name: 2–3 word label (e.g. "Skincare routine")
- guidance: 3 sentences of real, specific, useful advice about THIS exact issue — like a smart friend who actually knows about this. Not generic. Grounded in real knowledge.

Output ONLY valid JSON:
{
  "tasks": [
    {"text": "Do chemistry homework", "urgency": "tonight"},
    {"text": "Wash leotard for Saturday", "urgency": "tonight"},
    {"text": "Make cookies for bake sale", "urgency": "thisweek"},
    {"text": "Write birthday wishlist", "urgency": "thisweek"},
    {"text": "Finish app", "urgency": "whenever"}
  ],
  "projects": [
    {"name": "Skincare", "guidance": "If products work then stop, that's usually a damaged skin barrier. Strip back to just a gentle cleanser, moisturiser and SPF for 4 weeks — nothing else. Once your barrier is calm, add back one product at a time with 2 weeks between each."},
    {"name": "Hair styling", "guidance": "Most people fight their texture instead of working with it. Whether your hair is fine or thick, wavy or straight changes everything about what actually works. Tell me your hair type and I'll give you a proper routine."}
  ],
  "response": "1–3 warm, specific sentences. Sound like a real friend, not an app. Name at least one specific task you extracted. Mention that ongoing stuff is now in their Life tab if applicable. Never say 'I've sorted X tasks' generically."
}`;

  try {
    const msgs = [
      { role: 'system', content: system },
      { role: 'user',   content: text },
    ];

    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`,
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1400, messages: msgs }),
    });

    if (!res.ok) return parseBrainDumpLocal(text);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return parseBrainDumpLocal(text);
    const parsed = JSON.parse(jsonMatch[0]);

    const tasks = (parsed.tasks || []).map((item, i) => ({
      id: Date.now() + i,
      text: item.text || '',
      urgency: ['tonight', 'thisweek', 'whenever'].includes(item.urgency) ? item.urgency : 'whenever',
      priority: item.urgency === 'tonight' ? 'high' : item.urgency === 'thisweek' ? 'medium' : 'low',
      category: 'task',
    }));

    const projects = (parsed.projects || []).map((p, i) => ({
      id: Date.now() + 10000 + i,
      name: p.name || '',
      guidance: p.guidance || '',
    }));

    return { tasks, projects, response: parsed.response || null };
  } catch {
    return parseBrainDumpLocal(text);
  }
}

function parseBrainDumpLocal(text) {
  const parts = text.split(/[,\n;]+/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 120);
  const tasks = parts.map((t, i) => ({
    id: Date.now() + i, text: t,
    urgency: 'whenever', priority: 'medium', category: 'task',
  }));
  return { tasks, projects: [], response: null };
}

// ─── Goal action generator ───────────────────────────
export async function generateGoalAction({ goalText }) {
  if (!KEY) return `First step: break "${goalText}" into one small action you can do today.`;
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL, max_tokens: 120,
        messages: [
          { role: 'system', content: 'Generate a single concrete first action for a goal. One sentence, specific, doable today. No preamble, no markdown.' },
          { role: 'user', content: `Goal: "${goalText}"` },
        ],
      }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? `Start by researching "${goalText}" for 15 minutes.`;
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
