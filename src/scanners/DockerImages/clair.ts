// Clair image vulnerability scanner (using clairctl)
// Example: clairctl analyze myimage:tag
import { exec } from 'child_process';

interface ClairOptions {
  image: string;
  options?: string;
}

export function runClair({ image, options }: ClairOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `clairctl analyze ${image}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
