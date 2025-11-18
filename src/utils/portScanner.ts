import net from 'net';

export interface PortScanResult {
  port: number;
  open: boolean;
  banner?: string | undefined;
}

export async function scanPort(host: string, port: number, timeoutMs = 3000): Promise<PortScanResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.write(`HEAD / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
    });

    socket.on('data', (data) => {
      banner += data.toString();
    });

    const finalize = (open: boolean) => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();
      resolve({ port, open, banner: banner.trim().slice(0, 120) || undefined });
    };

    socket.on('error', () => finalize(false));
    socket.on('timeout', () => finalize(false));
    socket.on('close', () => finalize(true));

    socket.connect(port, host);
  });
}

export async function scanCommonPorts(host: string, ports: number[]): Promise<PortScanResult[]> {
  const results: PortScanResult[] = [];
  for (const port of ports) {
    try {
      const result = await scanPort(host, port);
      results.push(result);
    } catch {
      results.push({ port, open: false });
    }
  }
  return results;
}

