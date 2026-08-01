import type { Env } from "../types";
import { encryptSecret, pkceCodeChallenge, randomToken } from "../lib/crypto";
import { consumeOAuthState, saveOAuthState, upsertUser } from "../lib/db";
import { json, redirect } from "../lib/http";
import {
  clearSessionCookieHeader,
  endSession,
  establishSession,
  getCurrentSession,
  sessionCookieHeader,
} from "../lib/session";
import { buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo } from "../lib/tiktok";

export async function handleAuthStart(_request: Request, env: Env): Promise<Response> {
  const codeVerifier = randomToken(48);
  const codeChallenge = await pkceCodeChallenge(codeVerifier);
  const state = randomToken(24);

  await saveOAuthState(env, state, codeVerifier);

  return redirect(buildAuthorizeUrl(env, state, codeChallenge));
}

export async function handleAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const loginPage = `${env.PUBLIC_ORIGIN}/app/login.html`;

  const tikTokError = url.searchParams.get("error");
  if (tikTokError) {
    return redirect(`${loginPage}?error=${encodeURIComponent(tikTokError)}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirect(`${loginPage}?error=missing_params`);
  }

  const stateRow = await consumeOAuthState(env, state);
  if (!stateRow) {
    return redirect(`${loginPage}?error=state_mismatch`);
  }

  try {
    const tokenResp = await exchangeCodeForToken(env, code, stateRow.code_verifier);
    const userInfo = await fetchUserInfo(tokenResp.access_token);

    const [accessEnc, refreshEnc] = await Promise.all([
      encryptSecret(env, tokenResp.access_token),
      encryptSecret(env, tokenResp.refresh_token),
    ]);

    const nowS = Math.floor(Date.now() / 1000);
    const user = await upsertUser(env, {
      tiktokOpenId: userInfo.open_id,
      displayName: userInfo.display_name,
      avatarUrl: userInfo.avatar_url,
      accessTokenEnc: accessEnc.ciphertext,
      accessTokenIv: accessEnc.iv,
      refreshTokenEnc: refreshEnc.ciphertext,
      refreshTokenIv: refreshEnc.iv,
      accessTokenExpiresAt: nowS + tokenResp.expires_in,
      refreshTokenExpiresAt: nowS + tokenResp.refresh_expires_in,
      scope: tokenResp.scope,
    });

    const sessionId = await establishSession(env, request, user.id);

    return redirect(`${env.PUBLIC_ORIGIN}/app/dashboard.html`, {
      "Set-Cookie": sessionCookieHeader(sessionId),
    });
  } catch (err) {
    console.error("tiktok_oauth_callback_failed", err);
    return redirect(`${loginPage}?error=oauth_failed`);
  }
}

export async function handleAuthSession(request: Request, env: Env): Promise<Response> {
  const current = await getCurrentSession(env, request);
  if (!current) return json({ connected: false });
  return json({
    connected: true,
    displayName: current.user.display_name,
    avatarUrl: current.user.avatar_url,
  });
}

export async function handleAuthLogout(request: Request, env: Env): Promise<Response> {
  await endSession(env, request);
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}
