import * as detect from '../../src/scanners/GitRepoScans/detect-secrets.js';
import * as gitleaks from '../../src/scanners/GitRepoScans/Gitleaks.js';
import * as truffle from '../../src/scanners/GitRepoScans/TruffleHog.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '', code: 0 })
}));

describe('Git Repo Scanners', () => {
  it('runs detect-secrets repo scan', async () => {
    await expect(detect.scanWithDetectSecrets('.')).resolves.not.toThrow();
  });
  it('runs Gitleaks scan', async () => {
    await expect(gitleaks.run('.')).resolves.not.toThrow();
  });
  it('runs TruffleHog scan', async () => {
    await expect(truffle.run('.')).resolves.not.toThrow();
  });
});
