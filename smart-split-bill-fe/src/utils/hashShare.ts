/**
 * Utility untuk URL Fragment Sharing (FR-13)
 * Meng-encode dan men-decode state pembagian ke dalam #hash URL
 * menggunakan Base64 URL-Safe.
 * Karena berada di #hash, data TIDAK PERNAH dikirim ke server web!
 */

export interface ShareablePayload {
  v: number; // version
  items: {
    id: string;
    name: string;
    qty: number;
    unit_price: number;
    line_total: number;
    discount?: number;
  }[];
  participants: { id: string; name: string }[];
  assignments: Record<string, string[]>;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

export function encodeStateToHash(payload: ShareablePayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    // Encode UTF-8 ke Base64 URL-Safe
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `#share=${base64}`;
  } catch (err) {
    console.error('Gagal meng-encode hash:', err);
    return '';
  }
}

export function decodeStateFromHash(hash: string): ShareablePayload | null {
  try {
    if (!hash || !hash.includes('#share=')) return null;
    const base64Url = hash.replace(/^#share=/, '');
    // Kembalikan padding Base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const data = JSON.parse(jsonStr) as ShareablePayload;
    if (data && Array.isArray(data.items) && Array.isArray(data.participants)) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('Gagal membaca data dari hash URL:', err);
    return null;
  }
}

