import type { Env } from "../types";

/**
 * TikTok v2 Login Kit + Content Posting API client.
 *
 * These endpoint URLs and field names match TikTok's published v2 API as of
 * this writing. TikTok occasionally changes field names/requirements between
 * API versions - re-check https://developers.tiktok.com/doc/ against the
 * app's actual Developer Portal configuration before relying on this in
 * production, and watch the first real `/auth/tiktok/callback` and
 * `/api/posts/:id/publish` calls (via `wrangler tail`) for schema drift.
 */

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const CREATOR_INFO_URL = "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
const VIDEO_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

export function buildAuthorizeUrl(
  env: Env,
  state: string,
  codeChallenge: string,
  scope = "user.info.basic,video.publish"
): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("redirect_uri", env.TIKTOK_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  refresh_expires_in: number; // seconds
  open_id: string;
  scope: string;
  token_type: string;
}

interface TikTokApiEnvelope<T> {
  data: T;
  error?: { code: string; message?: string; log_id?: string };
}

async function postForm<T>(url: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = await res.json<T & { error?: unknown }>();
  if (!res.ok || json.error) {
    throw new Error(`TikTok API error (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

export async function exchangeCodeForToken(
  env: Env,
  code: string,
  codeVerifier: string
): Promise<TikTokTokenResponse> {
  return postForm<TikTokTokenResponse>(TOKEN_URL, {
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: env.TIKTOK_REDIRECT_URI,
    code_verifier: codeVerifier,
  });
}

export async function refreshAccessToken(
  env: Env,
  refreshToken: string
): Promise<TikTokTokenResponse> {
  return postForm<TikTokTokenResponse>(TOKEN_URL, {
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export interface TikTokUserInfo {
  open_id: string;
  display_name: string;
  avatar_url: string;
}

export async function fetchUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const url = new URL(USER_INFO_URL);
  url.searchParams.set("fields", "open_id,display_name,avatar_url");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json<TikTokApiEnvelope<{ user: TikTokUserInfo }>>();
  if (!res.ok || json.error?.code !== "ok") {
    throw new Error(`TikTok user info error: ${JSON.stringify(json)}`);
  }
  return json.data.user;
}

export interface CreatorInfo {
  creator_username: string;
  creator_nickname: string;
  creator_avatar_url: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

export async function queryCreatorInfo(accessToken: string): Promise<CreatorInfo> {
  const res = await fetch(CREATOR_INFO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const json = await res.json<TikTokApiEnvelope<CreatorInfo>>();
  if (!res.ok || json.error?.code !== "ok") {
    throw new Error(`TikTok creator info error: ${JSON.stringify(json)}`);
  }
  return json.data;
}

export interface PublishVideoInput {
  videoUrl: string;
  title: string; // caption + hashtags, TikTok has no separate hashtags field - append to title
  privacyLevel: string;
  disableDuet: boolean;
  disableComment: boolean;
  disableStitch: boolean;
  isAigc: boolean;
  isBrandedContent: boolean;
  publishTarget: "inbox" | "direct";
}

export interface PublishVideoResult {
  publishId: string;
}

/**
 * Starts a publish job using the PULL_FROM_URL source (TikTok's servers fetch
 * the video from our own /media/:key URL, which lives on the already-verified
 * balochsahab.com domain).
 *
 * `publishTarget: "inbox"` uses the Content Posting API's "upload to inbox"
 * behavior (post_mode/direct-post fields are omitted or set so the video
 * lands in the creator's TikTok inbox for them to review and post
 * themselves) rather than an unmediated direct public post - this is the
 * safer default for an app that has not yet passed TikTok's audit, since
 * unaudited apps' direct-post visibility is restricted to the authorizing
 * user regardless of the chosen privacy_level.
 */
export async function initVideoPublish(
  accessToken: string,
  input: PublishVideoInput
): Promise<PublishVideoResult> {
  const post_info: Record<string, unknown> = {
    title: input.title,
    privacy_level: input.privacyLevel,
    disable_duet: input.disableDuet,
    disable_comment: input.disableComment,
    disable_stitch: input.disableStitch,
    brand_content_toggle: input.isBrandedContent,
    brand_organic_toggle: false,
    is_aigc: input.isAigc,
  };

  const body = {
    post_info,
    source_info: {
      source: "PULL_FROM_URL",
      video_url: input.videoUrl,
    },
    post_mode: input.publishTarget === "direct" ? "DIRECT_POST" : "MEDIA_UPLOAD",
  };

  const res = await fetch(VIDEO_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json<TikTokApiEnvelope<{ publish_id: string }>>();
  if (!res.ok || json.error?.code !== "ok") {
    throw new Error(`TikTok publish init error: ${JSON.stringify(json)}`);
  }
  return { publishId: json.data.publish_id };
}

export async function fetchPublishStatus(accessToken: string, publishId: string): Promise<any> {
  const res = await fetch(PUBLISH_STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const json = await res.json<TikTokApiEnvelope<Record<string, unknown>>>();
  if (!res.ok || json.error?.code !== "ok") {
    throw new Error(`TikTok publish status error: ${JSON.stringify(json)}`);
  }
  return json.data;
}
