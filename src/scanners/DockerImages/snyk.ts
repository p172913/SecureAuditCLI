// Snyk CLI for container scanning
// Example: snyk container test myimage:tag
import { exec } from 'child_process';

interface SnykOptions {
  image: string;
  options?: string;
}

export function runSnykContainer({ image, options }: SnykOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `snyk container test ${image}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
