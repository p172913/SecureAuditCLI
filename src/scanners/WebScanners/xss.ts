import { URL } from 'url';
import { resolveResponseDetails } from '../../utils/httpClient.js';

interface XSStrikeOptions {
  url: string;
}

const PAYLOAD = '<svg/onload=alert`secaudit`>';

export async function runXSStrike({ url }: XSStrikeOptions): Promise<string> {
  const parsed = new URL(url);
  if ([...parsed.searchParams.keys()].length === 0) {
    parsed.searchParams.set('q', 'test');
  }
  const findings: string[] = [];

  for (const param of new Set(parsed.searchParams.keys())) {
    const testUrl = new URL(parsed.toString());
    testUrl.searchParams.set(param, PAYLOAD);
    try {
      const res = await resolveResponseDetails(testUrl.toString(), { timeoutMs: 8000 });
      const reflected = res.body.includes(PAYLOAD) || res.body.includes(encodeURIComponent(PAYLOAD));
      if (reflected) {
        findings.push(`Reflected XSS suspected on parameter "${param}"`);
      }
    } catch {
      // ignore errors
    }
  }

  if (findings.length === 0) {
    return 'No reflected XSS indicators detected.';
  }
  return findings.join('\n');
}
