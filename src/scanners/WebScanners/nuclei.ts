import { resolveResponseDetails } from '../../utils/httpClient.js';

interface NucleiOptions {
  url: string;
}

type Signature = {
  id: string;
  description: string;
  regex: RegExp;
};

const SIGNATURES: Signature[] = [
  { id: 'aws-key', description: 'Possible AWS access key exposure', regex: /(AKIA|ASIA)[0-9A-Z]{16}/g },
  { id: 'private-key', description: 'Potential private key material', regex: /-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----/g },
  { id: 'wp-config', description: 'WordPress config leakage', regex: /define\('DB_NAME'/g },
  { id: 's3-bucket', description: 'Exposed S3 bucket reference', regex: /s3\.amazonaws\.com\/[a-z0-9\-]+/gi },
  { id: 'stack-trace', description: 'Stack trace present in response', regex: /(Exception in thread|Traceback \(most recent call last\))/g },
];

export async function runNuclei({ url }: NucleiOptions): Promise<string> {
  const res = await resolveResponseDetails(url, { timeoutMs: 8000 });
  const findings: string[] = [];
  for (const signature of SIGNATURES) {
    if (signature.regex.test(res.body)) {
      findings.push(`${signature.id}: ${signature.description}`);
    }
  }
  if (findings.length === 0) {
    return 'No high-risk signatures detected.';
  }
  return findings.join('\n');
}
