import type { Env, UserRow } from "../types";
import { decryptSecret, encryptSecret } from "./crypto";
import { nowSec, updateUserTokens } from "./db";
import { refreshAccessToken } from "./tiktok";

const EXPIRY_SAFETY_MARGIN_SECONDS = 120;

/**
 * Returns a live TikTok access token for the given user, transparently
 * refreshing (and re-persisting, re-encrypted) it first if it's expired or
 * about to expire. Never returns plaintext tokens to the caller beyond this
 * one in-memory string, which the caller must not log or store.
 */
export async function getValidAccessToken(env: Env, user: UserRow): Promise<string> {
  if (user.access_token_expires_at > nowSec() + EXPIRY_SAFETY_MARGIN_SECONDS) {
    return decryptSecret(env, user.access_token_enc, user.access_token_iv);
  }

  const refreshToken = await decryptSecret(env, user.refresh_token_enc, user.refresh_token_iv);
  const refreshed = await refreshAccessToken(env, refreshToken);

  const [accessEnc, refreshEnc] = await Promise.all([
    encryptSecret(env, refreshed.access_token),
    encryptSecret(env, refreshed.refresh_token),
  ]);

  const t = nowSec();
  await updateUserTokens(env, user.id, {
    accessTokenEnc: accessEnc.ciphertext,
    accessTokenIv: accessEnc.iv,
    refreshTokenEnc: refreshEnc.ciphertext,
    refreshTokenIv: refreshEnc.iv,
    accessTokenExpiresAt: t + refreshed.expires_in,
    refreshTokenExpiresAt: t + refreshed.refresh_expires_in,
  });

  return refreshed.access_token;
}
