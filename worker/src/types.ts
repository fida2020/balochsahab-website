export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;

  PUBLIC_ORIGIN: string;
  TIKTOK_REDIRECT_URI: string;

  TIKTOK_CLIENT_KEY: string;
  TIKTOK_CLIENT_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
}

export interface UserRow {
  id: string;
  tiktok_open_id: string;
  display_name: string | null;
  avatar_url: string | null;
  access_token_enc: string;
  access_token_iv: string;
  refresh_token_enc: string;
  refresh_token_iv: string;
  access_token_expires_at: number;
  refresh_token_expires_at: number;
  scope: string;
  created_at: number;
  updated_at: number;
}

export interface SessionRow {
  id: string;
  user_id: string;
  created_at: number;
  expires_at: number;
  user_agent: string | null;
  ip_hash: string | null;
}

export interface OAuthStateRow {
  state: string;
  code_verifier: string;
  created_at: number;
  expires_at: number;
}

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type PublishTarget = "inbox" | "direct";

export interface PostRow {
  id: string;
  user_id: string;
  caption: string;
  hashtags: string; // JSON array as text
  media_key: string;
  video_url: string;
  privacy_level: string;
  disable_duet: number;
  disable_comment: number;
  disable_stitch: number;
  is_aigc: number;
  is_branded_content: number;
  publish_target: PublishTarget;
  status: PostStatus;
  scheduled_at: number | null;
  tiktok_publish_id: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface AuthedRequest {
  user: UserRow;
  session: SessionRow;
}
