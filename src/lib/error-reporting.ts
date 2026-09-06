// Generic client-side error reporter. Currently logs to the console; swap in
// a real monitoring service (Sentry, LogRocket, etc.) here if you add one.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[app error]", message, { ...context, stack, path: window.location.pathname });
}
