import * as aws from '../../src/scanners/cloud/awsMisconfigScan.js';
import * as docker from '../../src/scanners/cloud/dockerImageScan.js';
import * as gha from '../../src/scanners/cloud/githubActionsScan.js';
import * as kube from '../../src/scanners/cloud/kubernetesManifestScan.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '', code: 0 })
}));

describe('Cloud Scanners', () => {
  it('runs AWS misconfig scanner without error', async () => {
    await expect(aws.run()).resolves.not.toThrow();
  });
  it('runs Docker image scanner and throws if image not given', async () => {
    // Expects error if image arg missing
    await expect(docker.run()).rejects.toThrow('image argument required');
    // Ok if mock arg supplied
    await expect(docker.run('test-image')).resolves.not.toThrow();
  });
  it('runs GitHub Actions scan', async () => {
    await expect(gha.run()).resolves.not.toThrow();
  });
  it('runs K8s Manifest scan', async () => {
    await expect(kube.run()).resolves.not.toThrow();
  });
});
