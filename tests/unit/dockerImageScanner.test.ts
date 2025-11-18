import * as anchore from '../../src/scanners/DockerImages/anchore_cli.js';
import * as clair from '../../src/scanners/DockerImages/clair.js';
import * as cosign from '../../src/scanners/DockerImages/cosign.js';
import * as dockle from '../../src/scanners/DockerImages/dockle.js';
import * as grype from '../../src/scanners/DockerImages/grype.js';
import * as hadolint from '../../src/scanners/DockerImages/hadolint.js';
import * as snyk from '../../src/scanners/DockerImages/snyk.js';
import * as syft from '../../src/scanners/DockerImages/syft.js';
import * as trivy from '../../src/scanners/DockerImages/trivy.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'scan ok', stderr: '', code: 0 })
}));

describe('Docker Image Scanners', () => {
  it('runs each supported image scanner without error', async () => {
    await expect(anchore.run('image')).resolves.not.toThrow();
    await expect(clair.run('image')).resolves.not.toThrow();
    await expect(cosign.run('image')).resolves.not.toThrow();
    await expect(dockle.run('image')).resolves.not.toThrow();
    await expect(grype.run('image')).resolves.not.toThrow();
    await expect(hadolint.run('image')).resolves.not.toThrow();
    await expect(snyk.run('image')).resolves.not.toThrow();
    await expect(syft.run('image')).resolves.not.toThrow();
    await expect(trivy.run('image')).resolves.not.toThrow();
  });
});
