import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolDays, buildPlan, behind, weekOf } from './plan.js';

test('schoolDays skips weekends and holidays', () => {
  // Mon 1 Sep 2025 – Fri 12 Sep 2025, with Wed 3 – Thu 4 off
  const days = schoolDays('2025-09-01', '2025-09-12', [{ start: '2025-09-03', end: '2025-09-04' }]);
  assert.equal(days.length, 8);
  assert.ok(!days.includes('2025-09-03'));
  assert.ok(!days.includes('2025-09-06'));
});

test('buildPlan spreads topics and reschedules from planFrom', () => {
  const data = {
    start: '2025-09-01', end: '2025-09-12', holidays: [],
    subjects: [{ id: 's', name: 'Maths', topics: [
      { id: 'a', title: 'A', done: false },
      { id: 'b', title: 'B', done: false },
    ] }],
  };
  const plan = buildPlan(data);
  assert.deepEqual(plan.items.map((i) => i.date), ['2025-09-01', '2025-09-08']);
  assert.equal(behind(plan, '2025-09-10').length, 2);

  const re = buildPlan({ ...data, planFrom: '2025-09-10' });
  assert.equal(behind(re, '2025-09-10').length, 0);
  assert.deepEqual(re.items.map((i) => i.date), ['2025-09-10', '2025-09-11']);
});

test('weekOf returns Monday', () => {
  assert.equal(weekOf('2025-09-04'), '2025-09-01');
  assert.equal(weekOf('2025-09-07'), '2025-09-01');
});

test('ticking a topic off does not move the others', () => {
  const data = {
    start: '2025-09-01', end: '2025-09-12', holidays: [],
    subjects: [{ id: 's', name: 'Maths', topics: [
      { id: 'a', title: 'A', done: false },
      { id: 'b', title: 'B', done: false },
    ] }],
  };
  const ticked = { ...data, subjects: [{ ...data.subjects[0], topics: [
    { id: 'a', title: 'A', done: true, doneOn: '2025-09-01' },
    { id: 'b', title: 'B', done: false },
  ] }] };
  assert.deepEqual(buildPlan(ticked).items.map((i) => i.date), ['2025-09-08']);
});
