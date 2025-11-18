// Trivy container image vulnerability & misconfig scanner
// Example: trivy image --severity HIGH,CRITICAL myimage:tag
import { exec } from 'child_process';

interface TrivyOptions {
  image: string;
  severity?: string; // e.g., 'HIGH,CRITICAL'
  options?: string;
}

export function runTrivy({ image, severity, options }: TrivyOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `trivy image ${image}`;
    if (severity) cmd += ` --severity ${severity}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
