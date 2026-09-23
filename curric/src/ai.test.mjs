import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubjects } from './ai.js';

test('parseSubjects reads JSON, even with extra text around it', () => {
  const raw = 'Here you go:\n{"subjects":[{"name":" Maths ","topics":[{"title":"Fractions","lessons":3},""," Decimals",{"title":"Odd","lessons":"x"}]},{"name":"Empty","topics":[]}]}';
  assert.deepEqual(parseSubjects(raw), [{ name: 'Maths', topics: [
    { title: 'Fractions', lessons: 3 },
    { title: 'Decimals', lessons: 1 },
    { title: 'Odd', lessons: 1 },
  ] }]);
});

test('parseSubjects returns [] for junk', () => {
  assert.deepEqual(parseSubjects('no json here'), []);
  assert.deepEqual(parseSubjects('{bad json}'), []);
  assert.deepEqual(parseSubjects('{"foo":1}'), []);
});
