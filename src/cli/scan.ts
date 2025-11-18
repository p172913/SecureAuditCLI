// Scan CLI entry point for meta-scanner tool
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { runAllWebScanners, runWebScannerById, getWebScannerIds } from '../scanners/WebScanners/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[2] === 'scan') {
  process.argv.splice(2, 1);
}

const program = new Command();

type CategoryConfig = {
  dir: string;
  scanners: string[];
};

const SCANNER_CATEGORIES: Record<string, CategoryConfig> = {
  code: {
    dir: 'code',
    scanners: ['codeComplexity', 'codeVulnerability', 'dependencyLicense', 'outdatedDependencies', 'secretScan'],
  },
  repo: {
    dir: 'GitRepoScans',
    scanners: ['Gitleaks', 'TruffleHog', 'detect-secrets'],
  },
  images: {
    dir: 'ImagesScans',
    scanners: ['scanMalware', 'scanIntegrity', 'scanMetadata', 'scanNSFW', 'scanStego'],
  },
  web: {
    dir: 'WebScanners',
    scanners: getWebScannerIds(),
  },
  // Extend with additional categories as needed
};

// For each category, create subcommands dynamically
Object.entries(SCANNER_CATEGORIES).forEach(([category, config]) => {
  if (category === 'web') {
    program
      .command(`${category} [scanner]`)
      .option('--all', 'Run all scanners in the web category')
      .description('Run a web scanner or all web scanners')
      .argument('<url>', 'Target URL for the scan')
      .action(async (scanner: string | undefined, url: string, options: any) => {
        try {
          if (!url) {
            throw new Error('URL argument is required for web scans.');
          }
          if (options.all || !scanner) {
            await runAllWebScanners(url);
          } else {
            await runWebScannerById(scanner, url);
          }
        } catch (err) {
          console.error(chalk.red('Web scan failed:'), err);
          process.exit(2);
        }
      });
    return;
  }

  program
    .command(`${category} [scanner]`)
    .option('--all', `Run all scanners in the ${category} category`)
    .description(`Run a ${category} scanner or all scanners in that category`)
    .argument('[target]', 'Target file/folder for the scan (as needed)')
    .action(async (scanner: string | undefined, target: string | undefined, options: any) => {
      try {
        if (options.all || !scanner) {
          // Run all scanners in the category
          for (const s of config.scanners) {
            const modPath = resolveScannerModule(config.dir, s);
            prettyHeader(s, category);
            await runModule(modPath, target);
          }
        } else {
          const resolved = resolveScannerName(config.scanners, scanner);
          if (!resolved) {
            throw new Error(`Unknown ${category} scanner: ${scanner}. Available: ${config.scanners.join(', ')}`);
          }
          const modPath = resolveScannerModule(config.dir, resolved);
          prettyHeader(resolved, category);
          await runModule(modPath, target);
        }
      } catch (err) {
        console.error(chalk.red('Scan failed:'), err);
        process.exit(2);
      }
    });
});

function prettyHeader(scanner: string, category: string) {
  const emoji = {
    repo: '🔑',
    images: '🖼️',
    local: '🖥️',
    code: '💻',
    cloud: '☁️',
    web: '🌐',
  }[category] || '🧩';
  console.log(chalk.bgBlueBright(`\n${emoji} [${category}/${scanner}] Running scanner...\n`));
}

function resolveScannerName(scanners: string[], requested: string): string | undefined {
  return scanners.find((scanner) => scanner.toLowerCase() === requested.toLowerCase());
}

function resolveScannerModule(dir: string, scanner: string): string {
  return path.resolve(__dirname, '../scanners', dir, `${scanner}.js`);
}

async function runModule(modulePath: string, arg?: string) {
  try {
    // Dynamically import and execute 'run' method or default behavior
    const moduleUrl = pathToFileURL(modulePath).href;
    const mod = await import(moduleUrl);
    if (typeof mod.run === 'function') {
      await mod.run(arg);
    } else {
      // fallback: call CLI main if present (old style modules)
      if (typeof mod.default === 'function') {
        await mod.default(arg);
      } else {
        throw new Error('No runnable entry exported');
      }
    }
  } catch (e: any) {
    console.error(chalk.redBright(`[ERROR loading ${modulePath}]`), e.message);
  }
}

program.parseAsync(process.argv);
