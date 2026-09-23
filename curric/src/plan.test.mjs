import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolDays, buildPlan, behind, weekOf, parseTopicLine } from './plan.js';

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
  assert.equal(behind(plan, '2025-09-10').length, 1); // A was due by Fri 5th
  assert.equal(behind(plan, '2025-09-15').length, 2);

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

test('multi-lesson topics get more days', () => {
  const data = {
    start: '2025-09-01', end: '2025-09-12', holidays: [],
    subjects: [{ id: 's', name: 'Maths', topics: [
      { id: 'a', title: 'A', done: false, lessons: 3 },
      { id: 'b', title: 'B', done: false, lessons: 1 },
      { id: 'c', title: 'C', done: false },
    ] }],
  };
  // 10 school days over 5 lessons = 2 days per lesson
  const items = buildPlan(data).items.map((i) => [i.topic.id, i.date, i.endDate]);
  assert.deepEqual(items, [
    ['a', '2025-09-01', '2025-09-08'],
    ['b', '2025-09-09', '2025-09-10'],
    ['c', '2025-09-11', '2025-09-12'],
  ]);
});

test('parseTopicLine reads lesson counts', () => {
  assert.deepEqual(parseTopicLine('Fractions x3'), { title: 'Fractions', lessons: 3 });
  assert.deepEqual(parseTopicLine('Fractions ×2'), { title: 'Fractions', lessons: 2 });
  assert.deepEqual(parseTopicLine('World War 2 (4)'), { title: 'World War 2', lessons: 4 });
  assert.deepEqual(parseTopicLine('World War 2'), { title: 'World War 2', lessons: 1 });
  assert.deepEqual(parseTopicLine('Matrix'), { title: 'Matrix', lessons: 1 });
});

test('neighbouring topics never share a day', () => {
  const data = {
    start: '2025-09-01', end: '2025-09-12', holidays: [],
    subjects: [{ id: 's', name: 'Maths', topics: [
      { id: 'a', title: 'A', done: false },
      { id: 'b', title: 'B', done: false },
      { id: 'c', title: 'C', done: false },
    ] }],
  };
  const items = buildPlan(data).items;
  for (let i = 1; i < items.length; i++) assert.ok(items[i].date > items[i - 1].endDate);
});
