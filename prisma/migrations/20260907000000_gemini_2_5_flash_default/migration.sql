-- Default new AI configurations to Gemini 2.5 Flash (via OpenRouter) instead of the
-- placeholder "gemini-3.6-flash" value, which the transport layer used to silently
-- rewrite to a free, rate-limited model regardless of what was configured.
ALTER TABLE "AIConfiguration" ALTER COLUMN "model" SET DEFAULT 'google/gemini-2.5-flash';

-- Normalize existing rows that were still on that placeholder default or the forced
-- free-tier fallback so they pick up the new model without a manual admin edit.
UPDATE "AIConfiguration"
SET "model" = 'google/gemini-2.5-flash'
WHERE "model" IN ('gemini-3.6-flash', 'google/gemma-4-26b-a4b-it:free', 'gemma-4-26b-a4b-it:free');
