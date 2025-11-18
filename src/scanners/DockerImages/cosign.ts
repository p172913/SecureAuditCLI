// cosign image signing and verification (sigstore)
// Example: cosign sign --key cosign.key myimage:tag
// Example: cosign verify myimage:tag
import { exec } from 'child_process';

interface CosignOptions {
  action: 'sign' | 'verify';
  image: string;
  key?: string;
  options?: string;
}

export function runCosign({ action, image, key, options }: CosignOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `cosign ${action}`;
    if (action === 'sign' && key) cmd += ` --key ${key}`;
    cmd += ` ${image}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
