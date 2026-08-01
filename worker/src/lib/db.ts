import type { Env, OAuthStateRow, PostRow, SessionRow, UserRow } from "../types";
import { randomToken } from "./crypto";

export const nowSec = () => Math.floor(Date.now() / 1000);

// -- oauth_state (PKCE + CSRF state, single-use, short TTL) ---------------

export async function saveOAuthState(
  env: Env,
  state: string,
  codeVerifier: string,
  ttlSeconds = 600
): Promise<void> {
  const t = nowSec();
  await env.DB.prepare(
    "INSERT INTO oauth_state (state, code_verifier, created_at, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(state, codeVerifier, t, t + ttlSeconds)
    .run();
}

export async function consumeOAuthState(env: Env, state: string): Promise<OAuthStateRow | null> {
  const row = await env.DB.prepare("SELECT * FROM oauth_state WHERE state = ?")
    .bind(state)
    .first<OAuthStateRow>();
  if (!row) return null;
  await env.DB.prepare("DELETE FROM oauth_state WHERE state = ?").bind(state).run();
  if (row.expires_at < nowSec()) return null;
  return row;
}

// -- users -------------------------------------------------------------------

export interface UpsertUserInput {
  tiktokOpenId: string;
  displayName: string | null;
  avatarUrl: string | null;
  accessTokenEnc: string;
  accessTokenIv: string;
  refreshTokenEnc: string;
  refreshTokenIv: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  scope: string;
}

export async function upsertUser(env: Env, input: UpsertUserInput): Promise<UserRow> {
  const existing = await env.DB.prepare("SELECT * FROM users WHERE tiktok_open_id = ?")
    .bind(input.tiktokOpenId)
    .first<UserRow>();

  const t = nowSec();

  if (existing) {
    await env.DB.prepare(
      `UPDATE users SET display_name = ?, avatar_url = ?, access_token_enc = ?, access_token_iv = ?,
       refresh_token_enc = ?, refresh_token_iv = ?, access_token_expires_at = ?, refresh_token_expires_at = ?,
       scope = ?, updated_at = ? WHERE id = ?`
    )
      .bind(
        input.displayName,
        input.avatarUrl,
        input.accessTokenEnc,
        input.accessTokenIv,
        input.refreshTokenEnc,
        input.refreshTokenIv,
        input.accessTokenExpiresAt,
        input.refreshTokenExpiresAt,
        input.scope,
        t,
        existing.id
      )
      .run();
    return { ...existing, ...input, display_name: input.displayName, avatar_url: input.avatarUrl, updated_at: t } as UserRow;
  }

  const id = randomToken(16);
  await env.DB.prepare(
    `INSERT INTO users (id, tiktok_open_id, display_name, avatar_url, access_token_enc, access_token_iv,
     refresh_token_enc, refresh_token_iv, access_token_expires_at, refresh_token_expires_at, scope,
     created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.tiktokOpenId,
      input.displayName,
      input.avatarUrl,
      input.accessTokenEnc,
      input.accessTokenIv,
      input.refreshTokenEnc,
      input.refreshTokenIv,
      input.accessTokenExpiresAt,
      input.refreshTokenExpiresAt,
      input.scope,
      t,
      t
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  return row as UserRow;
}

export async function getUserById(env: Env, id: string): Promise<UserRow | null> {
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
}

export async function updateUserTokens(
  env: Env,
  userId: string,
  fields: {
    accessTokenEnc: string;
    accessTokenIv: string;
    refreshTokenEnc: string;
    refreshTokenIv: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  }
): Promise<void> {
  await env.DB.prepare(
    `UPDATE users SET access_token_enc = ?, access_token_iv = ?, refresh_token_enc = ?, refresh_token_iv = ?,
     access_token_expires_at = ?, refresh_token_expires_at = ?, updated_at = ? WHERE id = ?`
  )
    .bind(
      fields.accessTokenEnc,
      fields.accessTokenIv,
      fields.refreshTokenEnc,
      fields.refreshTokenIv,
      fields.accessTokenExpiresAt,
      fields.refreshTokenExpiresAt,
      nowSec(),
      userId
    )
    .run();
}

// -- sessions ------------------------------------------------------------------

export async function createSession(
  env: Env,
  userId: string,
  userAgent: string | null,
  ipHash: string | null,
  ttlSeconds = 60 * 60 * 24 * 30
): Promise<string> {
  const id = randomToken(32);
  const t = nowSec();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip_hash) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, t, t + ttlSeconds, userAgent, ipHash)
    .run();
  return id;
}

export async function getSessionWithUser(
  env: Env,
  sessionId: string
): Promise<{ session: SessionRow; user: UserRow } | null> {
  const session = await env.DB.prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(sessionId)
    .first<SessionRow>();
  if (!session || session.expires_at < nowSec()) return null;
  const user = await getUserById(env, session.user_id);
  if (!user) return null;
  return { session, user };
}

export async function deleteSession(env: Env, sessionId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

// -- posts -----------------------------------------------------------------------

export interface CreatePostInput {
  userId: string;
  caption: string;
  hashtags: string[];
  mediaKey: string;
  videoUrl: string;
  privacyLevel: string;
  disableDuet: boolean;
  disableComment: boolean;
  disableStitch: boolean;
  isAigc: boolean;
  isBrandedContent: boolean;
  publishTarget: "inbox" | "direct";
  scheduledAt: number | null;
}

export async function createPost(env: Env, input: CreatePostInput): Promise<PostRow> {
  const id = randomToken(16);
  const t = nowSec();
  const status = input.scheduledAt && input.scheduledAt > t ? "scheduled" : "draft";
  await env.DB.prepare(
    `INSERT INTO posts (id, user_id, caption, hashtags, media_key, video_url, privacy_level,
     disable_duet, disable_comment, disable_stitch, is_aigc, is_branded_content, publish_target,
     status, scheduled_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.userId,
      input.caption,
      JSON.stringify(input.hashtags),
      input.mediaKey,
      input.videoUrl,
      input.privacyLevel,
      input.disableDuet ? 1 : 0,
      input.disableComment ? 1 : 0,
      input.disableStitch ? 1 : 0,
      input.isAigc ? 1 : 0,
      input.isBrandedContent ? 1 : 0,
      input.publishTarget,
      status,
      input.scheduledAt,
      t,
      t
    )
    .run();
  const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<PostRow>();
  return row as PostRow;
}

export async function listPostsForUser(env: Env, userId: string): Promise<PostRow[]> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  )
    .bind(userId)
    .all<PostRow>();
  return results ?? [];
}

export async function getPostForUser(env: Env, id: string, userId: string): Promise<PostRow | null> {
  return env.DB.prepare("SELECT * FROM posts WHERE id = ? AND user_id = ?").bind(id, userId).first<PostRow>();
}

export async function deletePostForUser(env: Env, id: string, userId: string): Promise<boolean> {
  const res = await env.DB.prepare(
    "DELETE FROM posts WHERE id = ? AND user_id = ? AND status IN ('draft','scheduled')"
  )
    .bind(id, userId)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

export async function updatePostStatus(
  env: Env,
  id: string,
  status: PostRow["status"],
  extra: { tiktokPublishId?: string | null; errorMessage?: string | null } = {}
): Promise<void> {
  await env.DB.prepare(
    "UPDATE posts SET status = ?, tiktok_publish_id = COALESCE(?, tiktok_publish_id), error_message = ?, updated_at = ? WHERE id = ?"
  )
    .bind(status, extra.tiktokPublishId ?? null, extra.errorMessage ?? null, nowSec(), id)
    .run();
}

export async function getDuePosts(env: Env, limit = 20): Promise<PostRow[]> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= ? ORDER BY scheduled_at ASC LIMIT ?"
  )
    .bind(nowSec(), limit)
    .all<PostRow>();
  return results ?? [];
}
