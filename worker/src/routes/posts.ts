import type { Env, PostRow, UserRow } from "../types";
import {
  createPost,
  deletePostForUser,
  getPostForUser,
  getUserById,
  listPostsForUser,
  updatePostStatus,
} from "../lib/db";
import { badRequest, json, notFound } from "../lib/http";
import { initVideoPublish } from "../lib/tiktok";
import { getValidAccessToken } from "../lib/tokens";

const VALID_PRIVACY_LEVELS = new Set([
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
]);

interface CreatePostBody {
  caption?: string;
  hashtags?: string[];
  mediaKey?: string;
  videoUrl?: string;
  privacyLevel?: string;
  disableDuet?: boolean;
  disableComment?: boolean;
  disableStitch?: boolean;
  isAigc?: boolean;
  isBrandedContent?: boolean;
  publishTarget?: "inbox" | "direct";
  scheduledAt?: number | null; // unix seconds
}

export async function handleListPosts(env: Env, user: UserRow): Promise<Response> {
  const posts = await listPostsForUser(env, user.id);
  return json({ posts });
}

export async function handleCreatePost(request: Request, env: Env, user: UserRow): Promise<Response> {
  let body: CreatePostBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json_body");
  }

  if (!body.caption?.trim()) return badRequest("caption_required");
  if (!body.mediaKey || !body.videoUrl) return badRequest("video_required");
  if (!body.privacyLevel || !VALID_PRIVACY_LEVELS.has(body.privacyLevel)) {
    return badRequest("invalid_privacy_level");
  }
  if (typeof body.isAigc !== "boolean" || !body.isAigc) {
    // Mandatory per TikTok's AI-generated content disclosure policy - the
    // dashboard checkbox is required before submit, enforced again here.
    return badRequest("is_aigc_disclosure_required");
  }

  const post = await createPost(env, {
    userId: user.id,
    caption: body.caption.trim(),
    hashtags: (body.hashtags ?? []).map(String).slice(0, 10),
    mediaKey: body.mediaKey,
    videoUrl: body.videoUrl,
    privacyLevel: body.privacyLevel,
    disableDuet: !!body.disableDuet,
    disableComment: !!body.disableComment,
    disableStitch: !!body.disableStitch,
    isAigc: true,
    isBrandedContent: !!body.isBrandedContent,
    publishTarget: body.publishTarget === "direct" ? "direct" : "inbox",
    scheduledAt: body.scheduledAt ?? null,
  });

  return json({ post }, { status: 201 });
}

export async function handleGetPost(env: Env, user: UserRow, id: string): Promise<Response> {
  const post = await getPostForUser(env, id, user.id);
  if (!post) return notFound();
  return json({ post });
}

export async function handleDeletePost(env: Env, user: UserRow, id: string): Promise<Response> {
  const deleted = await deletePostForUser(env, id, user.id);
  if (!deleted) return notFound();
  return json({ ok: true });
}

/**
 * Shared publish logic used by both the immediate "publish now" route and
 * the cron sweep for scheduled posts.
 */
export async function publishPost(env: Env, post: PostRow, user: UserRow): Promise<void> {
  await updatePostStatus(env, post.id, "publishing");
  try {
    const accessToken = await getValidAccessToken(env, user);
    const hashtags: string[] = JSON.parse(post.hashtags || "[]");
    const title = [post.caption, ...hashtags.map((h) => `#${h}`)].join(" ").trim();

    const result = await initVideoPublish(accessToken, {
      videoUrl: post.video_url,
      title,
      privacyLevel: post.privacy_level,
      disableDuet: !!post.disable_duet,
      disableComment: !!post.disable_comment,
      disableStitch: !!post.disable_stitch,
      isAigc: !!post.is_aigc,
      isBrandedContent: !!post.is_branded_content,
      publishTarget: post.publish_target,
    });

    await updatePostStatus(env, post.id, "published", { tiktokPublishId: result.publishId });
  } catch (err) {
    console.error("publish_failed", post.id, err);
    await updatePostStatus(env, post.id, "failed", {
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function handlePublishPost(env: Env, user: UserRow, id: string): Promise<Response> {
  const post = await getPostForUser(env, id, user.id);
  if (!post) return notFound();
  if (post.status === "published" || post.status === "publishing") {
    return badRequest("post_already_published_or_publishing");
  }

  await publishPost(env, post, user);

  const updated = await getPostForUser(env, id, user.id);
  return json({ post: updated });
}

export async function publishDuePostsForCron(env: Env, duePosts: PostRow[]): Promise<void> {
  for (const post of duePosts) {
    const user = await getUserById(env, post.user_id);
    if (!user) {
      await updatePostStatus(env, post.id, "failed", { errorMessage: "user_not_found" });
      continue;
    }
    await publishPost(env, post, user);
  }
}
