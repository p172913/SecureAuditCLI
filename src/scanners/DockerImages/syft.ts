// Syft SBOM generator for container images
// Example: syft myimage:tag -o json > sbom.json
import { exec } from 'child_process';

interface SyftOptions {
  image: string;
  outputFormat?: string; // e.g., 'json', 'cyclonedx', etc.
  output?: string; // path or use '>'
  options?: string;
}

export function runSyft({ image, outputFormat, output, options }: SyftOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd = `syft ${image}`;
    if (outputFormat) cmd += ` -o ${outputFormat}`;
    if (output) cmd += ` > ${output}`;
    if (options) cmd += ` ${options}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}
