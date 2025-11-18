import { URL } from 'url';
import { resolveResponseDetails } from '../../utils/httpClient.js';
import { loadWordlist } from '../../utils/wordlist.js';

interface WfuzzOptions {
  url: string;
  wordlistPath?: string | undefined;
}

const DEFAULT_PAYLOADS = [
  `<script>alert(1)</script>`,
  `../../../../etc/passwd`,
  `' OR '1'='1`,
  `"><img src=x onerror=alert(1)>`,
  `%3Csvg/onload=alert('wfuzz')%3E`,
  `' UNION SELECT NULL--`,
];

export async function runWfuzz({ url, wordlistPath }: WfuzzOptions): Promise<string> {
  const payloads = await loadWordlist(wordlistPath, DEFAULT_PAYLOADS);
  const findings: string[] = [];
  const baseline = await resolveResponseDetails(url, { timeoutMs: 8000 }).catch(() => undefined);

  for (const payload of payloads.slice(0, 80)) {
    const encoded = encodeURIComponent(payload);
    const target = buildFuzzedUrl(url, encoded);
    try {
      const res = await resolveResponseDetails(target, { timeoutMs: 8000 });
      const reflectionDetected = res.body.includes(payload) || res.body.includes(encoded);
      const statusChanged = baseline ? res.status !== baseline.status : false;
      const sizeChange =
        baseline && baseline.contentLength > 0
          ? Math.abs(res.contentLength - baseline.contentLength) > baseline.contentLength * 0.4
          : false;
      if (reflectionDetected || statusChanged || sizeChange) {
        findings.push(`Potential issue with payload "${payload}" at ${target} (status ${res.status})`);
      }
    } catch {
      // ignore
    }
  }

  if (findings.length === 0) {
    return 'No fuzz anomalies detected.';
  }
  return findings.join('\n');
}

function buildFuzzedUrl(url: string, payload: string): string {
  if (url.includes('FUZZ')) {
    return url.replace(/FUZZ/g, payload);
  }
  const parsed = new URL(url);
  parsed.searchParams.set('input', payload);
  return parsed.toString();
}
