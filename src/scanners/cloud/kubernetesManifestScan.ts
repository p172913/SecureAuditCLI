import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run(manifestPath?: string) {
  if (!manifestPath) {
    throw new Error('kubernetesManifestScan.run: manifestPath argument required');
  }
  console.log(chalk.blue('☸️ Scanning Kubernetes manifests...'));
  const tools = [
    { cmd: `kube-score score ${manifestPath}`, tag: 'kube-score'},
    { cmd: `kubescape scan ${manifestPath}`, tag: 'kubescape'}
  ];
  for (const t of tools) {
    const res = await execAsync(t.cmd);
    console.log(chalk.yellow(`\n=== [${t.tag}] ===\n`));
    if (res.code === 0) {
      console.log(res.stdout);
    } else {
      console.error(chalk.red(res.stderr || res.stdout));
    }
  }
}
