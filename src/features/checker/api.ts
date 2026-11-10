import type { LinkResult, MessageResult, Risk } from './analyzers';
import type { QrResult } from './analyzers';

export interface ExternalResult { provider: 'isthisspam'; available: boolean; classification?: string; isSpam?: boolean; confidence?: number | null; reasons?: string[]; recommendations?: string[]; error?: string }

async function postApi<T>(path: string, payload: Record<string, string>, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : `Permintaan gagal (HTTP ${response.status}).`);
  if (!data || typeof data !== 'object') throw new Error('Respons server tidak dikenali.');
  return data as T;
}
export const checkUrlWithGoogleSafeBrowsing = (url: string, signal: AbortSignal) => postApi<LinkResult>('scan', { url }, signal);
export const checkMessage = (message: string, signal: AbortSignal) => postApi<MessageResult>('check-message', { message }, signal);
export const checkQr = (content: string, signal: AbortSignal) => postApi<QrResult>('check-qr', { content }, signal);
export const classifyMessageWithIsThisSpam = checkMessage;

export function addIsThisSpamFinding(result: MessageResult, external: ExternalResult): MessageResult {
  if (!external.available || !external.isSpam) return { ...result, external };
  const confidence = Number(external.confidence);
  const confident = !Number.isFinite(confidence) || confidence >= 0.6;
  const spam = external.classification === 'Spam';
  const points = spam ? confident ? 4 : 2 : confident ? 7 : 4;
  const severity: Risk = spam ? confident ? 'medium' : 'low' : confident ? 'high' : 'medium';
  const percentage = Number.isFinite(confidence) ? `, keyakinan ${Math.round(confidence * 100)}%` : '';
  const risk: Risk = result.score + points >= 7 ? 'high' : result.score + points >= 3 ? 'medium' : 'low';
  return { ...result, risk, score: result.score + points, external,
    findings: [...result.findings, { severity, message: `IsThisSpam menilai "${external.classification}"${percentage}.` }] };
}
