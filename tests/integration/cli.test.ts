import { execa } from 'execa';
import path from 'path';

describe('SecAuditHub CLI', () => {
  const CLI_PATH = path.resolve(__dirname, '../../src/cli/index.ts');

  it('shows help output', async () => {
    const { stdout } = await execa('node', [CLI_PATH, 'help']);
    expect(stdout).toMatch(/Usage: secaudithub/);
    expect(stdout).toMatch(/Commands:/);
  });

  it('lists scanners', async () => {
    const { stdout } = await execa('node', [CLI_PATH, 'list']);
    expect(stdout).toMatch(/scanner categories/i);
    expect(stdout).toMatch(/REPO:/i);
    expect(stdout).toMatch(/IMAGES:/i);
    expect(stdout).toMatch(/WEB:/i);
  });
});
