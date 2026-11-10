export type QrisLevel = 'caution' | 'warning';
export interface QrisResult {
  readonly level: QrisLevel;
  readonly title: string;
  readonly findings: readonly string[];
  readonly merchant?: string;
  readonly city?: string;
  readonly amount?: string;
}

export interface TlvField {
  readonly id: string;
  readonly value: string;
}
