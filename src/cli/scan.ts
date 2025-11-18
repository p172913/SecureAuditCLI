// Scan CLI entry point for meta-scanner tool
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { runAllWebScanners, runWebScannerById, getWebScannerIds } from '../scanners/WebScanners/index.js';

const program = new Command();

const SCANNER_CATEGORIES: Record<string, string[]> = {
  repo: ['Gitleaks', 'TruffleHog', 'detect-secrets'],
  images: ['scanMalware', 'scanIntegrity', 'scanMetadata', 'scanNSFW', 'scanStego'],
  web: getWebScannerIds(),
  // add other categories as discovered, following src/scanners
};

// For each category, create subcommands dynamically
Object.entries(SCANNER_CATEGORIES).forEach(([category, scanners]) => {
  if (category === 'web') {
    program
      .command(`${category} [scanner]`)
      .option('--all', 'Run all scanners in the web category')
      .description('Run a web scanner or all web scanners')
      .argument('<url>', 'Target URL for the scan')
      .action(async (scanner: string | undefined, options: any, url: string) => {
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
    .action(async (scanner: string | undefined, options: any, target: string | undefined) => {
      try {
        if (options.all || !scanner) {
          // Run all scanners in the category
          for (const s of scanners) {
            const modPath = path.resolve(
              __dirname,
              '../scanners',
              `${capitalize(category)}Scans`,
              s + '.ts',
            );
            prettyHeader(s, category);
            await runModule(modPath, target);
          }
        } else {
          // Run specific scanner
          const modPath = path.resolve(
            __dirname,
            '../scanners',
            `${capitalize(category)}Scans`,
            scanner + '.ts',
          );
          prettyHeader(scanner, category);
          await runModule(modPath, target);
        }
      } catch (err) {
        console.error(chalk.red('Scan failed:'), err);
        process.exit(2);
      }
    });
});

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

async function runModule(modulePath: string, arg?: string) {
  try {
    // Dynamically import and execute 'run' method or default behavior
    const mod = await import(modulePath.replace(/\\/g, '/'));
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
