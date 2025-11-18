import { scanCommonPorts } from '../../utils/portScanner.js';

interface NaabuOptions {
  host: string;
}

const DEFAULT_PORTS = [80, 443, 8080, 8443, 21, 22, 25, 110, 143, 3306, 5432];

export async function runNaabu({ host }: NaabuOptions): Promise<string> {
  const results = await scanCommonPorts(host, DEFAULT_PORTS);
  const openPorts = results.filter((result) => result.open);
  if (openPorts.length === 0) {
    return 'No commonly exposed ports detected.';
  }
  return openPorts
    .map((result) => `Port ${result.port} open${result.banner ? ` – banner: ${result.banner}` : ''}`)
    .join('\n');
}
