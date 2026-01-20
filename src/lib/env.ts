import "server-only";

import { z } from "zod";

const envSchema = z.object({
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required."),
  TVMAZE_BASE_URL: z
    .string()
    .url("TVMAZE_BASE_URL must be a valid URL.")
    .default("https://api.tvmaze.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}`
  );
}

export const env = parsed.data;
