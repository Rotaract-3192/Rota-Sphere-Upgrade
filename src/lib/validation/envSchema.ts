/**
 * Environment Variable Validation
 * Architecture §81: All required environment variables must be present at startup.
 * This module throws immediately if any required variable is missing,
 * preventing silent failures in production.
 *
 * Zod is used for runtime validation (TypeScript types are compile-time only).
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  // Clerk — server-side
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required"),

  // Supabase — server-side (service role must NEVER be NEXT_PUBLIC_)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),


  // SMTP — server-side
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().min(1, "SMTP_PORT is required"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM_EMAIL: z.string().email("SMTP_FROM_EMAIL must be a valid email"),

  // App
  APP_URL: z.string().url("APP_URL must be a valid URL"),

  // Security
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
});

const clientEnvSchema = z.object({
  // Clerk — public
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),

  // Supabase — public (anon key is safe to expose; RLS protects the data)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  // Maps
  NEXT_PUBLIC_OLA_MAPS_API_KEY: z.string().optional(),
});

/**
 * Validated server environment variables.
 * Only import this in server-side code (Server Components, Server Actions, API routes).
 * Never import in 'use client' files.
 */
function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Server environment validation failed. Check your .env.local file.");
  }
  return result.data;
}

/**
 * Validated client environment variables.
 * Safe to use in both server and client components.
 */
function validateClientEnv() {
  const result = clientEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Client environment validation failed. Check your .env.local file.");
  }
  return result.data;
}

// Lazy singletons — validated once on first access
let _serverEnv: z.infer<typeof serverEnvSchema> | null = null;
let _clientEnv: z.infer<typeof clientEnvSchema> | null = null;

export function getServerEnv() {
  if (!_serverEnv) _serverEnv = validateServerEnv();
  return _serverEnv;
}

export function getClientEnv() {
  if (!_clientEnv) _clientEnv = validateClientEnv();
  return _clientEnv;
}
