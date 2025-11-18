import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run(file: string) {
  if (!file) {
    throw new Error('metadataPrivacyScan.run: file argument required');
  }
  console.log(chalk.blue('🧾 Scanning for metadata privacy issues...'));
  const tools = [
    { cmd: `exiftool "${file}"`, tag: 'Exiftool'},
    { cmd: `mat2 --check "${file}"`, tag: 'MAT2'}
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
