import { resolveResponseDetails } from '../../utils/httpClient.js';

interface ZapOptions {
  url: string;
  output?: string;
}

const COOKIE_FLAGS = ['secure', 'httponly'];
const HEADER_REQUIREMENTS = ['content-security-policy', 'x-content-type-options', 'strict-transport-security'];

export async function runZapQuickScan({ url }: ZapOptions): Promise<string> {
  const res = await resolveResponseDetails(url, { timeoutMs: 8000 });
  const findings: string[] = [];

  const cookieHeader = res.headers['set-cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(/,(?=[^,]+=)/g);
    cookies.forEach((cookie) => {
      for (const flag of COOKIE_FLAGS) {
        if (!cookie.toLowerCase().includes(flag)) {
          findings.push(`Cookie missing ${flag} flag: ${cookie.trim()}`);
        }
      }
    });
  }

  for (const header of HEADER_REQUIREMENTS) {
    if (!res.headers[header]) {
      findings.push(`Missing recommended header: ${header}`);
    }
  }

  if (findings.length === 0) {
    return 'Passive checks passed without findings.';
  }
  return findings.join('\n');
}
