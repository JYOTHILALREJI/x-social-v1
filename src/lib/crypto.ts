"use client";

/**
 * End-to-End Encryption Module
 * 
 * Uses Web Crypto API (zero-dependency, built into every modern browser):
 * - ECDH (P-256 curve) for key exchange
 * - AES-256-GCM for symmetric encryption
 * - HKDF for key derivation
 * 
 * Flow:
 * 1. Each user generates an ECDH key pair (stored in IndexedDB)
 * 2. Public keys are exchanged via the server
 * 3. A shared AES key is derived per conversation using ECDH + HKDF
 * 4. Messages are encrypted with AES-GCM (random IV per message)
 */

const ECDH_PARAMS: EcKeyGenParams = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

const AES_KEY_LENGTH = 256;

// ==========================================
// KEY GENERATION
// ==========================================

/**
 * Generate a new ECDH key pair for the current user.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    ECDH_PARAMS,
    true, // extractable (needed for export/backup)
    ['deriveKey', 'deriveBits']
  );
}

// ==========================================
// KEY EXPORT / IMPORT (for server storage & key exchange)
// ==========================================

/**
 * Export a public key to JWK format (safe to send to server).
 */
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Import a public key from JWK format (received from server).
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    ECDH_PARAMS,
    true,
    [] // Public keys don't need usages for ECDH
  );
}

/**
 * Export a private key to JWK format (for backup).
 */
export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Import a private key from JWK format (from backup restore).
 */
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    ECDH_PARAMS,
    true,
    ['deriveKey', 'deriveBits']
  );
}

// ==========================================
// KEY DERIVATION (shared secret per conversation)
// ==========================================

/**
 * Derive a shared AES-256-GCM key from my private key + their public key.
 * Uses ECDH to compute shared bits, then HKDF to derive the final AES key.
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  // Step 1: ECDH → shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    256
  );

  // Step 2: Import shared bits as HKDF key material
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Step 3: HKDF → AES-256-GCM key  
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('x-social-e2ee-v1'),
      info: new TextEncoder().encode('message-encryption'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // non-extractable for security
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

// ==========================================
// MESSAGE ENCRYPTION / DECRYPTION
// ==========================================

export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded
  iv: string;         // Base64-encoded (12 bytes)
}

/**
 * Encrypt a plaintext message using AES-256-GCM.
 * Returns ciphertext + IV (both base64-encoded).
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random 12-byte IV (recommended for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt a ciphertext message using AES-256-GCM.
 * Returns the plaintext string.
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  sharedKey: CryptoKey
): Promise<string> {
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    sharedKey,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// ==========================================
// KEY BACKUP (Password-Protected Export)
// ==========================================

/**
 * Encrypt a private key with a user-provided password for backup.
 * Uses PBKDF2 to derive an AES key from the password.
 */
export async function encryptPrivateKeyForBackup(
  privateKey: CryptoKey,
  password: string
): Promise<string> {
  const jwk = await exportPrivateKey(privateKey);
  const plaintext = JSON.stringify(jwk);

  // Derive key from password using PBKDF2
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000, // High iteration count for brute-force resistance
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );

  // Pack: salt(16) + iv(12) + ciphertext
  const packed = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(encrypted), salt.length + iv.length);

  return arrayBufferToBase64(packed.buffer as ArrayBuffer);
}

/**
 * Decrypt a backed-up private key using the user's password.
 */
export async function decryptPrivateKeyFromBackup(
  backupData: string,
  password: string
): Promise<CryptoKey> {
  const packed = new Uint8Array(base64ToArrayBuffer(backupData));
  const bytes = packed;

  // Unpack: salt(16) + iv(12) + ciphertext
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  const jwk = JSON.parse(new TextDecoder().decode(decrypted));
  return importPrivateKey(jwk);
}

// ==========================================
// UTILITIES
// ==========================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}
