export interface PracticeChoice {
  readonly id: string;
  readonly text: string;
  readonly correct: boolean;
  readonly feedback: string;
}

export interface PracticeScenario {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly avatar: string;
  readonly messages: readonly string[];
  readonly question: string;
  readonly choices: readonly PracticeChoice[];
}
