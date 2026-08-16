/**
 * Structured Logger
 * Architecture §63: Every critical operation must have structured logs + request IDs.
 *
 * - In development: pretty console output with colors
 * - In production: JSON output for log aggregation (Sentry, Datadog, etc.)
 *
 * Never log: secret keys, raw_response from payment gateway, PII beyond what's necessary.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  eventId?: string;
  orderId?: string;
  action?: string;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === "development";

function formatDev(level: LogLevel, message: string, context?: LogContext): string {
  const colors: Record<LogLevel, string> = {
    debug: "\x1b[36m",  // cyan
    info:  "\x1b[32m",  // green
    warn:  "\x1b[33m",  // yellow
    error: "\x1b[31m",  // red
  };
  const reset = "\x1b[0m";
  const ts = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `${colors[level]}[${level.toUpperCase()}]${reset} ${ts} ${message}${ctx}`;
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(context ?? {}),
  };

  if (isDev) {
    const formatted = formatDev(level, message, context);
    if (level === "error") console.error(formatted);
    else if (level === "warn") console.warn(formatted);
    else console.log(formatted);
  } else {
    // Production: structured JSON for log aggregation
    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info:  (message: string, context?: LogContext) => log("info",  message, context),
  warn:  (message: string, context?: LogContext) => log("warn",  message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
