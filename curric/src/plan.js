// Core planning logic for Curric. Dates are 'YYYY-MM-DD' strings.

const DAY = 24 * 60 * 60 * 1000;

const toTime = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (t) => new Date(t).toISOString().slice(0, 10);

export const isValidDate = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso || '') && toIso(toTime(iso)) === iso;

export const todayIso = () => {
  const now = new Date();
  return toIso(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// Monday of the week containing `iso`.
export const weekOf = (iso) => {
  const t = toTime(iso);
  const dow = (new Date(t).getUTCDay() + 6) % 7; // Mon = 0
  return toIso(t - dow * DAY);
};

export const prettyDate = (iso) =>
  new Date(toTime(iso)).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });

// Weekdays between start and end (inclusive) that aren't in a holiday.
export function schoolDays(start, end, holidays = []) {
  if (!isValidDate(start) || !isValidDate(end)) return [];
  const breaks = holidays
    .filter((h) => isValidDate(h.start) && isValidDate(h.end))
    .map((h) => [toTime(h.start), toTime(h.end)]);
  const days = [];
  for (let t = toTime(start); t <= toTime(end); t += DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (breaks.some(([a, b]) => t >= a && t <= b)) continue;
    days.push(toIso(t));
  }
  return days;
}

// Spread each subject's topics evenly over the school days from `planFrom`
// (set when rescheduling) or the term start. Topics covered before that date
// are left out, so ticking a topic off never moves the others.
export function buildPlan(data) {
  const from = data.planFrom && data.planFrom > data.start ? data.planFrom : data.start;
  const days = schoolDays(from, data.end, data.holidays);
  const items = [];
  for (const subject of data.subjects) {
    const pool = subject.topics.filter((t) => !t.done || (t.doneOn && t.doneOn >= from));
    pool.forEach((topic, i) => {
      if (topic.done) return;
      const date = days.length ? days[Math.floor((i * days.length) / pool.length)] : null;
      items.push({ subject, topic, date });
    });
  }
  items.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  return { items, schoolDayCount: days.length };
}

// Uncovered topics that were planned before today.
export const behind = (plan, today) =>
  plan.items.filter((it) => it.date && it.date < today);
