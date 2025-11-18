import chalk from 'chalk';
import { URL } from 'url';
import { config } from '../../cli/config.mjs';
import { runDirsearch } from './dirsearch.js';
import { runFfuf } from './ffuf.js';
import { runGobuster } from './gobuster.js';
import { runHttpx } from './httpx.js';
import { runNaabu } from './naabu.js';
import { runNikto } from './nikto.js';
import { runNmap } from './nmap.js';
import { runNuclei } from './nuclei.js';
import { runSqlmap } from './sqlmap.js';
import { runWfuzz } from './wfuzz.js';
import { runZapQuickScan } from './zap.js';
import { runXSStrike } from './xss.js';

type RunContext = {
  url: string;
  host: string;
  wordlist?: string | undefined;
  zapOutput?: string | undefined;
};

type ScannerDefinition = {
  id: string;
  label: string;
  run: (ctx: RunContext) => Promise<string | void>;
};

const WEB_SCANNERS: ScannerDefinition[] = [
  {
    id: 'dirsearch',
    label: 'dirsearch',
    run: async ({ url, wordlist }) => runDirsearch({ url, wordlistPath: wordlist }),
  },
  {
    id: 'ffuf',
    label: 'ffuf',
    run: async ({ url, wordlist }) => runFfuf({ url, wordlistPath: wordlist }),
  },
  {
    id: 'gobuster',
    label: 'Gobuster',
    run: async ({ url, wordlist }) => runGobuster({ url, wordlistPath: wordlist }),
  },
  {
    id: 'httpx',
    label: 'httpx',
    run: async ({ url }) => runHttpx({ url }),
  },
  {
    id: 'naabu',
    label: 'naabu',
    run: async ({ host }) => runNaabu({ host }),
  },
  {
    id: 'nikto',
    label: 'Nikto',
    run: async ({ host }) => runNikto({ host }),
  },
  {
    id: 'nmap',
    label: 'Nmap',
    run: async ({ host }) => runNmap({ host }),
  },
  {
    id: 'nuclei',
    label: 'Nuclei',
    run: async ({ url }) => runNuclei({ url }),
  },
  {
    id: 'sqlmap',
    label: 'sqlmap',
    run: async ({ url }) => runSqlmap({ url }),
  },
  {
    id: 'wfuzz',
    label: 'wfuzz',
    run: async ({ url, wordlist }) => runWfuzz({ url, wordlistPath: wordlist }),
  },
  {
    id: 'zap',
    label: 'OWASP ZAP',
    run: async ({ url, zapOutput }) =>
      zapOutput ? runZapQuickScan({ url, output: zapOutput }) : runZapQuickScan({ url }),
  },
  {
    id: 'xsstrike',
    label: 'XSStrike',
    run: async ({ url }) => runXSStrike({ url }),
  },
];

function createContext(url: string): RunContext {
  const parsed = new URL(url);
  const ctx: RunContext = {
    url,
    host: parsed.hostname,
    wordlist: config.wordlistPath,
    zapOutput: config.zapOutputPath,
  };
  return ctx;
}

export async function runAllWebScanners(url: string) {
  const ctx = createContext(url);
  console.log(chalk.bgMagentaBright(`\n🌐 Running web scanners against ${ctx.url}`));
  for (const scanner of WEB_SCANNERS) {
    await runScannerWithContext(scanner, ctx);
  }
}

async function runScannerWithContext(scanner: ScannerDefinition, ctx: RunContext) {
  console.log(chalk.bgBlueBright(`\n>>> [${scanner.label}] Starting`));
  try {
    const result = await scanner.run(ctx);
    if (result) {
      console.log(result);
    }
    console.log(chalk.green(`[${scanner.label}] completed successfully.`));
  } catch (err: any) {
    console.error(chalk.red(`[${scanner.label}] failed: ${err?.message || err}`));
  }
}

export async function runWebScannerById(id: string, url: string) {
  const scanner = WEB_SCANNERS.find(
    (s) => s.id.toLowerCase() === id.toLowerCase() || s.label.toLowerCase() === id.toLowerCase(),
  );
  if (!scanner) {
    throw new Error(`Unknown web scanner: ${id}`);
  }
  const ctx = createContext(url);
  await runScannerWithContext(scanner, ctx);
}

export function listWebScannerLabels(): string[] {
  return WEB_SCANNERS.map((s) => s.label);
}

export function getWebScannerIds(): string[] {
  return WEB_SCANNERS.map((s) => s.id);
}
