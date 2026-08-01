import type { Env, UserRow } from "../types";
import { json } from "../lib/http";
import { getValidAccessToken } from "../lib/tokens";
import { queryCreatorInfo } from "../lib/tiktok";

export async function handleCreatorInfo(env: Env, user: UserRow): Promise<Response> {
  try {
    const accessToken = await getValidAccessToken(env, user);
    const info = await queryCreatorInfo(accessToken);
    return json(info);
  } catch (err) {
    console.error("creator_info_failed", err);
    return json({ error: "creator_info_failed" }, { status: 502 });
  }
}
