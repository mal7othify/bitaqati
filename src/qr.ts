/* QR generation: library-generated (qrcode npm), never a
   third-party service. Two renderings of the same code:
   - PNG, 1024px, opaque white background: the default download. Phones
     show it in the gallery / Photos, wallets and messaging apps accept it,
     and a transparent background would break scanning on dark surfaces.
   - SVG: vector for print at any size.
   Error correction M and a 4-module quiet zone (the ISO 18004 minimum;
   trimming it is the most common cause of failed scans on printed cards).
   Generated on demand and cached hard at the edge - deterministic output,
   so this is equivalent to generating at creation time without storing
   files. */

import QRCode from 'qrcode';

const OPTS = {
  errorCorrectionLevel: 'M' as const,
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
};

export const QR_PNG_SIZE = 1024;

export function qrTargetUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/${id}?src=qr`;
}

/** Download filename: ASCII-only and stable per card, so a re-download
    replaces the previous file instead of piling up "qr (3).png". */
export function qrFilename(id: string, format: 'png' | 'svg'): string {
  return `bitaqati-${id}-qr.${format}`;
}

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPTS, type: 'svg' });
}

export function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTS, type: 'png', width: QR_PNG_SIZE });
}
