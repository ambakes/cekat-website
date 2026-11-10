import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioBank } from '../src/features/practice/scenarios.ts';
import { createPracticeSet, getPracticeScore, shuffle } from '../src/features/practice/model.ts';

test('latihan menengah memiliki enam soal dengan pilihan A–C', () => {
  assert.equal(scenarioBank.length, 6);
  assert.equal(new Set(scenarioBank.map((scenario) => scenario.id)).size, 6);
  for (const scenario of scenarioBank) {
    assert.equal(scenario.choices.length, 3);
    assert.equal(scenario.choices.filter((choice) => choice.correct).length, 1);
    assert.equal(new Set(scenario.choices.map((choice) => choice.id)).size, 3);
    assert(scenario.choices.every((choice) => choice.feedback.length > 20));
  }
});
test('pengacakan tidak memutasi bank soal dan dapat diuji dengan random terkontrol', () => {
  const before = JSON.stringify(scenarioBank);
  const round = createPracticeSet(scenarioBank, () => 0);
  assert.equal(JSON.stringify(scenarioBank), before);
  assert.notEqual(round[0].id, scenarioBank[0].id);
  assert.deepEqual(new Set(round.map((scenario) => scenario.id)), new Set(scenarioBank.map((scenario) => scenario.id)));
  assert.deepEqual(shuffle([], () => 0), []);
});
test('skor mengikuti identitas pilihan setelah urutan diacak', () => {
  const round = createPracticeSet(scenarioBank, () => .2);
  const answers = Object.fromEntries(round.map((scenario, index) => [scenario.id, scenario.choices.find((choice) => index !== 0 ? choice.correct : !choice.correct)!.id]));
  assert.deepEqual(getPracticeScore(round, answers), { answered: 6, correct: 5, total: 6, complete: true });
  assert.deepEqual(getPracticeScore(round, {}), { answered: 0, correct: 0, total: 6, complete: false });
});
