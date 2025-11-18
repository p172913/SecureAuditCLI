import { performance } from 'perf_hooks';
import { resolveResponseDetails, summarizeResponse } from '../../utils/httpClient.js';

interface HttpxOptions {
  url: string;
}

const CRITICAL_HEADERS = ['content-security-policy', 'strict-transport-security', 'x-frame-options'];

export async function runHttpx({ url }: HttpxOptions): Promise<string> {
  const start = performance.now();
  const details = await resolveResponseDetails(url, { timeoutMs: 8000 });
  const duration = Math.round(performance.now() - start);
  const missing = CRITICAL_HEADERS.filter((header) => !details.headers[header]);

  const lines = [
    summarizeResponse(details),
    `Response time: ${duration} ms`,
    missing.length > 0 ? `Missing headers: ${missing.join(', ')}` : 'All critical headers present.',
  ];

  return lines.join('\n');
}
