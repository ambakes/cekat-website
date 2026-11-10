import { scenarioBank } from './scenarios.ts';
import type { PracticeScenario } from './types.ts';

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function createPracticeSet(bank: readonly PracticeScenario[] = scenarioBank, random: () => number = Math.random): PracticeScenario[] {
  return shuffle(bank, random).map((scenario) => ({ ...scenario, choices: shuffle(scenario.choices, random) }));
}

export function getPracticeScore(scenarios: readonly PracticeScenario[], answers: Readonly<Record<string, string>>) {
  const answered = scenarios.filter((scenario) => answers[scenario.id] !== undefined).length;
  const correct = scenarios.filter((scenario) => scenario.choices.some((choice) => choice.id === answers[scenario.id] && choice.correct)).length;
  return { answered, correct, total: scenarios.length, complete: answered === scenarios.length };
}
