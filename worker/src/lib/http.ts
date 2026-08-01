export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(): Response {
  return json({ error: "not_authenticated" }, { status: 401 });
}

export function notFound(): Response {
  return json({ error: "not_found" }, { status: 404 });
}

export function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, ...extraHeaders },
  });
}
