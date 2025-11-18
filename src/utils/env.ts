export function getEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

// For required variables: throws if missing
export function getRequiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

// Placeholder: in the future, call dotenv here to load .env files
type LoadEnvOptions = { path?: string };
export function loadEnv(_opts: LoadEnvOptions = {}): void {
  // If you want to use dotenv:
  // require('dotenv').config(_opts)
  // For now, stub only
}
