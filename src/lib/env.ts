/**
 * Environment variable validation utilities for RussMeister.
 * Use these helpers instead of reading process.env directly.
 */

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        'Ensure it is set in your .env.local file or Vercel project settings.'
    );
  }
  return value;
}

export function getOptionalEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value) {
    return fallback ?? '';
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate that all critical environment variables are present.
 * Call this at server-side API route init to fail fast.
 */
export function validateServerEnv(): void {
  getRequiredEnv('ANTHROPIC_API_KEY');
}
