import type { Env } from "../types";

// -- base64 / base64url helpers -------------------------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// -- random tokens (session ids, PKCE verifier, CSRF state) ---------------

export function randomToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64UrlEncode(bytes);
}

// -- PKCE S256 code_challenge ----------------------------------------------

export async function pkceCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

// -- AES-256-GCM token encryption at rest ----------------------------------

async function importKey(env: Env): Promise<CryptoKey> {
  const raw = base64ToBytes(env.TOKEN_ENCRYPTION_KEY);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(
  env: Env,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await importKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuf)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptSecret(env: Env, ciphertext: string, iv: string): Promise<string> {
  const key = await importKey(env);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext)
  );
  return new TextDecoder().decode(plainBuf);
}
