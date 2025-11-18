import * as integrity from '../../src/scanners/ImagesScans/scanIntegrity.js';
import * as malware from '../../src/scanners/ImagesScans/scanMalware.js';
import * as metadata from '../../src/scanners/ImagesScans/scanMetadata.js';
import * as nsfw from '../../src/scanners/ImagesScans/scanNSFW.js';
import * as stego from '../../src/scanners/ImagesScans/scanStego.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'imagescan ok', stderr: '', code: 0 })
}));

describe('Images Scanners', () => {
  it('runs integrity scan', async () => {
    await expect(integrity.run('file.png')).resolves.not.toThrow();
  });
  it('runs malware scan', async () => {
    await expect(malware.run('file.png')).resolves.not.toThrow();
  });
  it('runs metadata scan', async () => {
    await expect(metadata.run('file.png')).resolves.not.toThrow();
  });
  it('runs nsfw scan', async () => {
    await expect(nsfw.run('file.png')).resolves.not.toThrow();
  });
  it('runs stego scan', async () => {
    await expect(stego.run('file.png')).resolves.not.toThrow();
  });
});
