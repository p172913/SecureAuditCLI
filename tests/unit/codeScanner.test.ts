import * as complexity from '../../src/scanners/code/codeComplexity.js';
import * as vuln from '../../src/scanners/code/codeVulnerability.js';
import * as license from '../../src/scanners/code/dependencyLicense.js';
import * as outdated from '../../src/scanners/code/outdatedDependencies.js';
import * as secrets from '../../src/scanners/code/secretScan.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'good', stderr: '', code: 0 })
}));

describe('Code Scanners', () => {
  it('runs code complexity scan', async () => {
    await expect(complexity.run()).resolves.not.toThrow();
  });
  it('runs code vulnerability scan', async () => {
    await expect(vuln.run()).resolves.not.toThrow();
  });
  it('runs dependency license scan', async () => {
    await expect(license.run()).resolves.not.toThrow();
  });
  it('runs outdated dependencies scan', async () => {
    await expect(outdated.run()).resolves.not.toThrow();
  });
  it('runs secret scan', async () => {
    await expect(secrets.run()).resolves.not.toThrow();
  });
});
