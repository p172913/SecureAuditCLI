import { resolveResponseDetails } from '../../utils/httpClient.js';
import { loadWordlist } from '../../utils/wordlist.js';

interface FfufOptions {
  url: string;
  wordlistPath?: string | undefined;
}

const DEFAULT_FUZZ_WORDS = ['admin', 'dashboard', 'api', 'backup.zip', 'config.php', 'login'];

export async function runFfuf({ url, wordlistPath }: FfufOptions): Promise<string> {
  const words = await loadWordlist(wordlistPath, DEFAULT_FUZZ_WORDS);
  const targetTemplate = url.includes('FUZZ') ? url : `${url.replace(/\/$/, '')}/FUZZ`;
  const findings: string[] = [];

  for (const word of words.slice(0, 150)) {
    const fuzzedUrl = targetTemplate.replace(/FUZZ/g, word);
    try {
      const res = await resolveResponseDetails(fuzzedUrl, { timeoutMs: 6000 });
      if (res.status >= 200 && res.status < 400) {
        findings.push(`${res.status} ${fuzzedUrl}`);
      }
    } catch {
      // ignore failures
    }
  }

  if (findings.length === 0) {
    return 'No fuzzable endpoints detected.';
  }
  return findings.join('\n');
}
