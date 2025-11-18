import { resolveResponseDetails, buildUrl } from '../../utils/httpClient.js';
import { loadWordlist } from '../../utils/wordlist.js';

interface GobusterOptions {
  url: string;
  wordlistPath?: string | undefined;
}

const DEFAULT_GOBUSTER_WORDS = ['admin/', 'assets/', 'images/', 'js/', 'uploads/', 'backup/', 'hidden/'];

export async function runGobuster({ url, wordlistPath }: GobusterOptions): Promise<string> {
  const entries = await loadWordlist(wordlistPath, DEFAULT_GOBUSTER_WORDS);
  const findings: string[] = [];
  for (const entry of entries.slice(0, 150)) {
    const target = buildUrl(url, entry);
    try {
      const res = await resolveResponseDetails(target, { timeoutMs: 6000 });
      if (res.status < 400) {
        findings.push(`${res.status} ${target}`);
      }
    } catch {
      // ignore
    }
  }
  return findings.length > 0 ? findings.join('\n') : 'No directory findings.';
}
