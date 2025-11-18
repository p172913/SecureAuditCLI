import chalk from 'chalk';
import { execAsync } from '../../exec.js';
import { existsSync } from 'fs';

export async function run(file: string) {
  if (!file) {
    throw new Error('stegoScan.run: file argument required');
  }
  console.log(chalk.blue('🕵️ Scanning for steganography...'));
  const tools = [
    { cmd: `zsteg "${file}"`, tag: 'zsteg'},
    { cmd: `binwalk "${file}"`, tag: 'binwalk'}
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
  // Optionally run stegseek if password list present
  if (existsSync('wordlist.txt')) {
    const stegseekRes = await execAsync(`stegseek "${file}" wordlist.txt`);
    console.log(chalk.yellow(`\n=== [stegseek] ===\n`));
    if (stegseekRes.code === 0) {
      console.log(stegseekRes.stdout);
    } else {
      console.error(chalk.red(stegseekRes.stderr || stegseekRes.stdout));
    }
  } else {
    console.warn(chalk.gray('wordlist.txt not found, skipping stegseek scan.'));
  }
}
