import { resolveResponseDetails, buildUrl } from '../../utils/httpClient.js';
import { loadWordlist } from '../../utils/wordlist.js';

interface DirsearchOptions {
  url: string;
  wordlistPath?: string | undefined;
}

const DEFAULT_DIRS = ['admin', 'login', 'uploads', 'config', 'backup', 'server-status', '.git/HEAD'];

export async function runDirsearch({ url, wordlistPath }: DirsearchOptions): Promise<string> {
  const wordlist = await loadWordlist(wordlistPath, DEFAULT_DIRS);
  const findings: string[] = [];
  for (const entry of wordlist.slice(0, 200)) {
    const target = buildUrl(url, entry);
    try {
      const res = await resolveResponseDetails(target, { timeoutMs: 6000 });
      if (res.status === 404) continue;
      findings.push(`${res.status} ${target}`);
    } catch {
      // ignore unreachable paths
    }
  }
  if (findings.length === 0) {
    return 'No common directories detected.';
  }
  return findings.join('\n');
}
