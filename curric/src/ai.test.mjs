import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubjects } from './ai.js';

test('parseSubjects reads JSON, even with extra text around it', () => {
  const raw = 'Here you go:\n{"subjects":[{"name":" Maths ","topics":["Fractions",""," Decimals"]},{"name":"Empty","topics":[]}]}';
  assert.deepEqual(parseSubjects(raw), [{ name: 'Maths', topics: ['Fractions', 'Decimals'] }]);
});

test('parseSubjects returns [] for junk', () => {
  assert.deepEqual(parseSubjects('no json here'), []);
  assert.deepEqual(parseSubjects('{bad json}'), []);
  assert.deepEqual(parseSubjects('{"foo":1}'), []);
});
