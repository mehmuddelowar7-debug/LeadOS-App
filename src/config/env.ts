import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_ENABLE_AI: z.enum(['true', 'false']).optional(),
})

// Extract the environment variables from import.meta.env
// We cast it to Record<string, string> so zod can parse it.
const _env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  VITE_ENABLE_AI: import.meta.env.VITE_ENABLE_AI,
}

const parsed = envSchema.safeParse(_env)

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  )
  throw new Error("Invalid environment variables")
}

export const env = parsed.data
