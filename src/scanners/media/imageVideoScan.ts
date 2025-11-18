import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run(file: string) {
  if (!file) {
    throw new Error('imageVideoScan.run: file argument required');
  }
  console.log(chalk.blue('🧬 Scanning media file for malware...'));
  const tools = [
    { cmd: `clamscan "${file}"`, tag: 'ClamAV'},
    { cmd: `yara rules.yar "${file}"`, tag: 'YARA'},
    { cmd: `loki -p "${file}"`, tag: 'Loki'}
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
