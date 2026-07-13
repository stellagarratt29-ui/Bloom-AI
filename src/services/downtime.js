import AsyncStorage from '@react-native-async-storage/async-storage';
import { callClaude, getApiKey } from './ai';

const SNOOZE_KEY   = '@bloom_snoozed_tasks';
const WINDOWS_KEY  = '@bloom_struggle_windows';
const APPS_KEY     = '@bloom_distraction_apps';

// ── Snooze storage ───────────────────────────────────────────────────────────

export async function getSnoozed() {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Prune expired snoozes
    const now = Date.now();
    const pruned = Object.fromEntries(Object.entries(data).filter(([, until]) => until > now));
    if (Object.keys(pruned).length !== Object.keys(data).length) {
      await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch { return {}; }
}

export async function snoozeTask(taskId, minutes = 30) {
  try {
    const current = await getSnoozed();
    current[taskId] = Date.now() + minutes * 60000;
    await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(current));
  } catch {}
}

// ── Struggle windows ─────────────────────────────────────────────────────────

export async function getStruggleWindows() {
  try {
    const raw = await AsyncStorage.getItem(WINDOWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveStruggleWindows(windows) {
  try { await AsyncStorage.setItem(WINDOWS_KEY, JSON.stringify(windows)); } catch {}
}

export function isInStruggleWindow(windows) {
  if (!windows?.length) return false;
  const now   = new Date();
  const hhmm  = now.getHours() * 60 + now.getMinutes();
  return windows.some(({ startHHMM, endHHMM }) => {
    if (startHHMM <= endHHMM) return hhmm >= startHHMM && hhmm < endHHMM;
    // overnight window e.g. 22:00 – 02:00
    return hhmm >= startHHMM || hhmm < endHHMM;
  });
}

// ── Distraction apps ─────────────────────────────────────────────────────────

export async function getDistractionApps() {
  try {
    const raw = await AsyncStorage.getItem(APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveDistractionApps(apps) {
  try { await AsyncStorage.setItem(APPS_KEY, JSON.stringify(apps)); } catch {}
}

// ── Effort estimation ────────────────────────────────────────────────────────

const HEAVY_WORDS = /\b(research|write|essay|presentation|project|plan|design|build|create|develop|study for|prepare|organise|organize|review all|analyse|analyze|deep.?dive)\b/i;
const QUICK_WORDS = /\b(reply|respond|email|text|message|call|book|buy|order|check|pay|fill in|fill out|submit|upload|send|read|watch|look up|google|search|remind|reschedule|cancel|confirm|remind)\b/i;

export function estimateEffortMinutes(taskText) {
  if (!taskText) return 30;
  const t = taskText.trim();
  if (HEAVY_WORDS.test(t)) return 60;
  if (QUICK_WORDS.test(t)) return 10;
  if (t.length < 35) return 10;
  if (t.length < 70) return 20;
  return 40;
}

// ── Task ranking for downtime ────────────────────────────────────────────────

export function rankTasksForDowntime(tasks, timeLimitMins, snoozed = {}) {
  const eligible = tasks.filter(t =>
    !t.done &&
    !snoozed[t.id] &&
    estimateEffortMinutes(t.text) <= (timeLimitMins ?? 999)
  );

  // Score: quick tasks score highest, then medium priority, then low
  return eligible
    .map(t => {
      const effort = estimateEffortMinutes(t.text);
      let score = 0;
      if (effort <= 10) score += 3;
      else if (effort <= 20) score += 2;
      else if (effort <= 40) score += 1;
      if (t.priority === 'medium') score += 1;
      if (t.priority === 'low')    score += 0.5;
      return { ...t, _effort: effort, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 3);
}

// ── Reason why this task fits right now ─────────────────────────────────────

const SECTION_LABELS = { high: 'School & Health', medium: 'Tasks', low: 'Fun & Leisure' };

export function taskReason(task) {
  const effort = estimateEffortMinutes(task.text);
  const section = SECTION_LABELS[task.priority] ?? 'Tasks';
  if (effort <= 10) return `Quick win — takes about 10 minutes. From ${section}.`;
  if (effort <= 20) return `Doable in ~${effort} min. From ${section}.`;
  return `A solid ${effort}-min task from ${section}.`;
}

// ── AI-powered reason (optional, uses API) ───────────────────────────────────

export async function taskReasonAI(task, timeLimitMins) {
  try {
    const key = await getApiKey();
    if (!key) return taskReason(task);
    const section = SECTION_LABELS[task.priority] ?? 'Tasks';
    const reply = await callClaude({
      system: 'You write one short sentence (max 12 words) explaining why a specific task is a good thing to do right now during a short break. Be direct and specific. No filler.',
      messages: [{ role: 'user', content: `Task: "${task.text}" | Time available: ${timeLimitMins ?? '?'} min | Section: ${section}` }],
      maxTokens: 40,
    });
    return reply?.trim() || taskReason(task);
  } catch { return taskReason(task); }
}

// ── Hobby suggestion ─────────────────────────────────────────────────────────

export function pickHobbyActivity(hobbies) {
  if (!hobbies?.length) return null;
  const active = hobbies.filter(h => h.milestones?.length > 0);
  if (!active.length) return hobbies[0] ?? null;
  // Pick the one with the lowest progress %
  return active.sort((a, b) => {
    const pa = (a.milestoneIndex ?? 0) / (a.milestones?.length ?? 1);
    const pb = (b.milestoneIndex ?? 0) / (b.milestones?.length ?? 1);
    return pa - pb;
  })[0];
}
