"use client";

/**
 * IndexedDB Key Store for E2EE
 * 
 * Stores cryptographic keys locally in the browser:
 * - Private ECDH key (never sent to the server)
 * - Derived conversation keys (cached for performance)
 * 
 * Uses IndexedDB because:
 * - Can store CryptoKey objects directly (non-extractable keys)
 * - Persists across sessions (unlike sessionStorage)
 * - Larger storage than localStorage
 * - Async API doesn't block the main thread
 */

import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptPrivateKeyForBackup,
  exportPrivateKey,
  importPrivateKey,
} from './crypto';

const DB_NAME = 'x-social-e2ee';
const DB_VERSION = 1;
const KEY_STORE = 'keys';
const CONVERSATION_STORE = 'conversation-keys';

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // Store for the user's own key pair
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' });
      }
      // Store for derived conversation keys (cache)
      if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
        db.createObjectStore(CONVERSATION_STORE, { keyPath: 'conversationId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// KEY PAIR MANAGEMENT
// ==========================================

interface StoredKeyPair {
  id: string; // 'my-keypair'
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
  createdAt: number;
}

/**
 * Get the user's key pair from IndexedDB.
 * Returns null if no key pair exists yet.
 */
export async function getMyKeyPair(userId: string): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readonly');
      const store = tx.objectStore(KEY_STORE);
      const request = store.get(`keypair-${userId}`);

      request.onsuccess = async () => {
        const stored = request.result as StoredKeyPair | undefined;
        if (!stored) {
          resolve(null);
          return;
        }
        try {
          const publicKey = await importPublicKey(stored.publicKey);
          const privateKey = await importPrivateKey(stored.privateKey);
          resolve({ publicKey, privateKey });
        } catch (err) {
          console.error('[KeyStore] Failed to import stored keys:', err);
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Generate and store a new key pair.
 * Returns the public key JWK (to upload to server).
 */
export async function generateAndStoreKeyPair(userId: string): Promise<JsonWebKey> {
  const keyPair = await generateKeyPair();
  const publicJwk = await exportPublicKey(keyPair.publicKey);
  const privateJwk = await exportPrivateKey(keyPair.privateKey);

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    const store = tx.objectStore(KEY_STORE);

    const entry: StoredKeyPair = {
      id: `keypair-${userId}`,
      publicKey: publicJwk,
      privateKey: privateJwk,
      createdAt: Date.now(),
    };

    const request = store.put(entry);
    request.onsuccess = () => resolve(publicJwk);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// CONVERSATION KEY CACHE
// ==========================================

interface StoredConversationKey {
  conversationId: string;
  otherUserPublicKey: JsonWebKey;
  // We can't store non-extractable CryptoKeys in IDB directly,
  // so we derive them on-demand and cache in memory.
}

// In-memory cache for derived AES keys (performance optimization)
// Map<conversationId, { sharedKey: CryptoKey, publicKeyJwk: string }>
const derivedKeyCache = new Map<string, { sharedKey: CryptoKey, publicKeyJwk: string }>();

/**
 * Get or derive the shared encryption key for a conversation.
 * 
 * Flow:
 * 1. Check in-memory cache
 * 2. If cached, verify that the public key JWK matches (prevents stale keys)
 * 3. If not cached or stale, derive from our private key + their public key
 * 4. Cache the result for future use
 */
export async function getConversationKey(
  userId: string,
  conversationId: string,
  theirPublicKeyJwk: JsonWebKey
): Promise<CryptoKey | null> {
  const publicKeyStr = JSON.stringify(theirPublicKeyJwk);

  // Check memory cache first
  const cacheKey = `${userId}-${conversationId}`;
  const cached = derivedKeyCache.get(cacheKey);
  if (cached && cached.publicKeyJwk === publicKeyStr) {
    return cached.sharedKey;
  }

  // Derive new key using our private key
  const myKeys = await getMyKeyPair(userId);
  if (!myKeys) return null;

  try {
    const theirPublicKey = await importPublicKey(theirPublicKeyJwk);
    const sharedKey = await deriveSharedKey(myKeys.privateKey, theirPublicKey);
    
    // Store in memory cache
    derivedKeyCache.set(cacheKey, { sharedKey, publicKeyJwk: publicKeyStr });
    
    return sharedKey;
  } catch (err) {
    console.error('[KeyStore] Failed to derive conversation key:', err);
    return null;
  }
}

/**
 * Clear the cached conversation key (e.g. when keys are rotated).
 */
export function clearConversationKey(conversationId: string): void {
  derivedKeyCache.delete(conversationId);
}

/**
 * Clear all cached keys.
 */
export function clearAllCachedKeys(): void {
  derivedKeyCache.clear();
}

// ==========================================
// KEY BACKUP
// ==========================================

/**
 * Create a password-protected backup of the private key.
 * This can be stored on the server for multi-device key sync.
 */
export async function createKeyBackup(userId: string, password: string): Promise<string | null> {
  const myKeys = await getMyKeyPair(userId);
  if (!myKeys) return null;

  return encryptPrivateKeyForBackup(myKeys.privateKey, password);
}

/**
 * Check if a key pair exists in the store.
 */
export async function hasKeyPair(userId: string): Promise<boolean> {
  const keys = await getMyKeyPair(userId);
  return keys !== null;
}
