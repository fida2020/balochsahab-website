import type { Env } from "./types";
import { getDuePosts } from "./lib/db";
import { unauthorized } from "./lib/http";
import { getCurrentSession } from "./lib/session";
import {
  handleAuthCallback,
  handleAuthLogout,
  handleAuthSession,
  handleAuthStart,
} from "./routes/auth";
import { handleCreatorInfo } from "./routes/creator";
import { handleAiSuggest } from "./routes/ai";
import { handleMediaGet, handleMediaUpload } from "./routes/media";
import {
  handleCreatePost,
  handleDeletePost,
  handleGetPost,
  handleListPosts,
  handlePublishPost,
  publishDuePostsForCron,
} from "./routes/posts";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      // -- public auth routes ---------------------------------------------
      if (pathname === "/auth/tiktok/start" && method === "GET") {
        return handleAuthStart(request, env);
      }
      if (pathname === "/auth/tiktok/callback" && method === "GET") {
        return handleAuthCallback(request, env);
      }
      if (pathname === "/auth/session" && method === "GET") {
        return handleAuthSession(request, env);
      }
      if (pathname === "/auth/logout" && method === "POST") {
        return handleAuthLogout(request, env);
      }

      // -- public media serving (TikTok's servers fetch this unauthenticated) --
      if (pathname.startsWith("/media/") && method === "GET") {
        const key = pathname.slice("/media/".length);
        return handleMediaGet(env, key);
      }

      // -- everything else under /api/* requires a session -----------------
      if (pathname.startsWith("/api/")) {
        const current = await getCurrentSession(env, request);
        if (!current) return unauthorized();
        const { user } = current;

        if (pathname === "/api/posts" && method === "GET") {
          return handleListPosts(env, user);
        }
        if (pathname === "/api/posts" && method === "POST") {
          return handleCreatePost(request, env, user);
        }
        const postMatch = pathname.match(/^\/api\/posts\/([^/]+)$/);
        if (postMatch && method === "GET") {
          return handleGetPost(env, user, postMatch[1]);
        }
        if (postMatch && method === "DELETE") {
          return handleDeletePost(env, user, postMatch[1]);
        }
        const publishMatch = pathname.match(/^\/api\/posts\/([^/]+)\/publish$/);
        if (publishMatch && method === "POST") {
          return handlePublishPost(env, user, publishMatch[1]);
        }
        if (pathname === "/api/media/upload" && method === "POST") {
          return handleMediaUpload(request, env, user);
        }
        if (pathname === "/api/tiktok/creator-info" && method === "GET") {
          return handleCreatorInfo(env, user);
        }
        if (pathname === "/api/ai/suggest" && method === "POST") {
          return handleAiSuggest(request, env, user);
        }
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error("unhandled_worker_error", err);
      return new Response("Internal error", { status: 500 });
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const duePosts = await getDuePosts(env);
        if (duePosts.length === 0) return;
        console.log(`cron: publishing ${duePosts.length} due post(s)`);
        await publishDuePostsForCron(env, duePosts);
      })()
    );
  },
};
