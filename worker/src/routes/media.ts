import type { Env, UserRow } from "../types";
import { randomToken } from "../lib/crypto";
import { badRequest, json, notFound } from "../lib/http";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB - conservative for Workers request body limits on the free plan
const ALLOWED_CONTENT_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function handleMediaUpload(request: Request, env: Env, user: UserRow): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength && contentLength > MAX_UPLOAD_BYTES) {
    return badRequest("video_too_large");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("invalid_multipart_form");
  }

  const file = form.get("video");
  if (!(file instanceof File)) {
    return badRequest("missing_video_file");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return badRequest("video_too_large");
  }
  const contentType = file.type || "video/mp4";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return badRequest("unsupported_video_type");
  }

  const extension = contentType === "video/quicktime" ? "mov" : contentType === "video/webm" ? "webm" : "mp4";
  const key = `${user.id}/${randomToken(16)}.${extension}`;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType },
  });

  return json({
    key,
    url: `${env.PUBLIC_ORIGIN}/media/${key}`,
  });
}

export async function handleMediaGet(env: Env, key: string): Promise<Response> {
  const object = await env.MEDIA.get(key);
  if (!object) return notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
