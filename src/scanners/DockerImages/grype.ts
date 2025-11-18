// Grype container image vulnerability scanner (Anchore)
// Example: grype myimage:tag
import { exec } from 'child_process';

interface GrypeOptions {
  image: string;
  options?: string;
}

export function runGrype({ image, options }: GrypeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `grype ${image}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
