import { resolveResponseDetails, buildUrl } from '../../utils/httpClient.js';

interface NiktoOptions {
  host: string;
}

const INSECURE_HEADERS = ['x-powered-by', 'server'];
const SENSITIVE_ENDPOINTS = ['server-status', '.git/HEAD', '.env', 'phpinfo.php'];

export async function runNikto({ host }: NiktoOptions): Promise<string> {
  const baseUrl = host.startsWith('http') ? host : `https://${host}`;
  const findings: string[] = [];
  const res = await resolveResponseDetails(baseUrl, { timeoutMs: 8000 });

  for (const header of INSECURE_HEADERS) {
    if (res.headers[header]) {
      findings.push(`Header ${header}: ${res.headers[header]}`);
    }
  }

  const missingHeaders = ['content-security-policy', 'x-frame-options', 'strict-transport-security'].filter(
    (header) => !res.headers[header],
  );
  if (missingHeaders.length > 0) {
    findings.push(`Missing hardening headers: ${missingHeaders.join(', ')}`);
  }

  for (const endpoint of SENSITIVE_ENDPOINTS) {
    const target = buildUrl(baseUrl, endpoint);
    try {
      const endpointRes = await resolveResponseDetails(target, { timeoutMs: 5000 });
      if (endpointRes.status < 400) {
        findings.push(`Sensitive endpoint exposed: ${target} (${endpointRes.status})`);
      }
    } catch {
      // ignore
    }
  }

  if (findings.length === 0) {
    return 'No obvious misconfigurations detected.';
  }
  return findings.join('\n');
}
