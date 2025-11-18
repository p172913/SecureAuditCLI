import fs from 'fs/promises';

export async function loadWordlist(wordlistPath: string | undefined, fallback: string[]): Promise<string[]> {
  if (!wordlistPath) {
    return fallback;
  }
  try {
    const raw = await fs.readFile(wordlistPath, 'utf-8');
    const entries = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return entries.length > 0 ? entries : fallback;
  } catch {
    return fallback;
  }
}

