/* QR generation: library-generated (qrcode npm), never a
   third-party service. SVG for print + 1024px PNG, error correction M.
   Generated on demand and cached hard at the edge - deterministic output,
   so this is equivalent to generating at creation time without storing
   files. */

import QRCode from 'qrcode';

const OPTS = { errorCorrectionLevel: 'M' as const, margin: 2 };

export function qrTargetUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/${id}?src=qr`;
}

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPTS, type: 'svg' });
}

export function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTS, type: 'png', width: 1024 });
}
