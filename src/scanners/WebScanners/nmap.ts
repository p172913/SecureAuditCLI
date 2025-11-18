import { resolveResponseDetails } from '../../utils/httpClient.js';
import { scanCommonPorts } from '../../utils/portScanner.js';

interface NmapOptions {
  host: string;
}

const PORTS_TO_SCAN = [80, 443, 8080, 8443, 22, 25, 110, 143, 3389, 5900];

export async function runNmap({ host }: NmapOptions): Promise<string> {
  const results = await scanCommonPorts(host, PORTS_TO_SCAN);
  const summaries: string[] = [];
  for (const result of results) {
    if (!result.open) continue;
    let serviceInfo = '';
    if ([80, 8080].includes(result.port)) {
      const res = await resolveResponseDetails(`http://${host}:${result.port}`, { timeoutMs: 6000 }).catch(() => undefined);
      if (res) {
        serviceInfo = `HTTP ${res.status} ${res.headers['server'] || ''}`.trim();
      }
    } else if ([443, 8443].includes(result.port)) {
      const res = await resolveResponseDetails(`https://${host}:${result.port}`, { timeoutMs: 6000 }).catch(() => undefined);
      if (res) {
        serviceInfo = `HTTPS ${res.status} ${res.headers['server'] || ''}`.trim();
      }
    } else if (result.banner) {
      serviceInfo = result.banner;
    }
    summaries.push(`Port ${result.port} open${serviceInfo ? ` – ${serviceInfo}` : ''}`);
  }
  return summaries.length > 0 ? summaries.join('\n') : 'No open ports detected on common services.';
}
