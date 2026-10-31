import crypto from 'crypto';

/**
 * Derives a consistent 32-byte key from the configured ENCRYPTION_KEY.
 * Falls back to a deterministic application key if ENCRYPTION_KEY is unset in development.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'zendo-production-encryption-key-aes-256-gcm-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive string data using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex-encoded)
 */
export function encryptData(plaintext: string): string {
  if (!plaintext) return '';
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts AES-256-GCM encrypted payload.
 * Expects format: iv:authTag:ciphertext
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed');
    return '';
  }
}

/**
 * Masks an API key or secret to only show the last 4 characters.
 * Example: "re_1234567890abcdef" -> "••••••••••••cdef"
 */
export function maskKey(rawKey: string): string {
  if (!rawKey) return '';
  if (rawKey.length <= 4) return '••••';
  const lastFour = rawKey.slice(-4);
  const bulletCount = Math.min(rawKey.length - 4, 12);
  return '•'.repeat(bulletCount) + lastFour;
}
