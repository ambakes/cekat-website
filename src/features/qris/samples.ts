import { crc16 } from './analyzeQris.ts';

/** Payload rekaan untuk latihan parser; bukan QR pembayaran. */
const prefix = '00020101021153033605405250005802ID5910KEDAI SORE6008MAKASSAR6304';
export const demoQris = prefix + crc16(prefix);
export const invalidQris = demoQris.slice(0, -4) + (demoQris.endsWith('0000') ? 'FFFF' : '0000');
