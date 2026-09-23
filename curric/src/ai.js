// AI curriculum import, using Groq (same setup as Bloom).
const AI_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';

const SYSTEM = `You turn school curriculum documents into a teaching plan.
Return JSON only, in this exact shape:
{"subjects":[{"name":"Maths","topics":[{"title":"Place value","lessons":2},{"title":"Fractions","lessons":4}]}]}
Rules:
- One entry per subject. Keep topics in the order they should be taught.
- Each topic has a short title (under 8 words) and an estimate of how many lessons it needs.
- If the document says how long a topic takes, use that.
- Ignore dates, holidays, admin notes and anything that isn't teachable content.`;

// Pull a clean [{ name, topics: [{ title, lessons }] }] list out of the model's reply.
export function parseSubjects(raw) {
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) return [];
  let json;
  try { json = JSON.parse(match[0]); } catch { return []; }
  return (Array.isArray(json.subjects) ? json.subjects : [])
    .map((sub) => ({
      name: String(sub?.name ?? '').trim(),
      topics: (Array.isArray(sub?.topics) ? sub.topics : [])
        .map((t) => ({
          title: String(typeof t === 'object' ? t?.title ?? '' : t).trim(),
          lessons: Math.min(Math.max(Math.round(Number(t?.lessons) || 1), 1), 99),
        }))
        .filter((t) => t.title),
    }))
    .filter((sub) => sub.name && sub.topics.length);
}

export async function importCurriculum(text) {
  if (!KEY) throw new Error('Add EXPO_PUBLIC_GROQ_KEY to curric/.env to use AI import.');
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: text.slice(0, 20000) },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `AI request failed (${res.status})`);
  }
  const data = await res.json();
  const subjects = parseSubjects(data.choices?.[0]?.message?.content ?? '');
  if (!subjects.length) throw new Error("Couldn't find any subjects or topics in that text.");
  return subjects;
}
