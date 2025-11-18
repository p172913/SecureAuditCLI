import { setTimeout as delay } from 'timers/promises';
import { fetch } from 'undici';
import type { RequestInit, Response } from 'undici';
import { URL } from 'url';

export interface HttpResponseDetails {
  url: string;
  status: number;
  ok: boolean;
  redirected: boolean;
  headers: Record<string, string>;
  body: string;
  contentLength: number;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 10000, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveResponseDetails(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<HttpResponseDetails> {
  const response = await fetchWithTimeout(url, init);
  const body = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return {
    url: response.url || url,
    status: response.status,
    ok: response.ok,
    redirected: response.redirected,
    headers,
    body,
    contentLength: body.length,
  };
}

export function buildUrl(base: string, addition: string): string {
  const trimmedAddition = addition.startsWith('/') ? addition.slice(1) : addition;
  const normalized = base.endsWith('/') ? base : `${base}/`;
  const parsed = new URL(trimmedAddition, normalized);
  return parsed.toString();
}

export function summarizeResponse(details: HttpResponseDetails): string {
  const lines: string[] = [];
  lines.push(`Status: ${details.status}`);
  lines.push(`Final URL: ${details.url}`);
  const server = details.headers['server'];
  if (server) {
    lines.push(`Server: ${server}`);
  }
  const poweredBy = details.headers['x-powered-by'];
  if (poweredBy) {
    lines.push(`X-Powered-By: ${poweredBy}`);
  }
  lines.push(`Content-Length: ${details.contentLength}`);
  lines.push(`Redirected: ${details.redirected ? 'yes' : 'no'}`);
  return lines.join('\n');
}

export async function fetchMultiple(detectors: string[], baseUrl: string): Promise<HttpResponseDetails[]> {
  const results: HttpResponseDetails[] = [];
  for (const path of detectors) {
    try {
      const target = buildUrl(baseUrl, path);
      const res = await resolveResponseDetails(target, { timeoutMs: 6000 });
      results.push(res);
    } catch {
      // ignore errors for individual paths
    }
    await delay(50);
  }
  return results;
}

