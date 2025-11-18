import * as contentSafety from '../../src/scanners/media/contentSafetyScan.js';
import * as hashIntegrity from '../../src/scanners/media/hashIntegrityScan.js';
import * as imageVideo from '../../src/scanners/media/imageVideoScan.js';
import * as metadataPrivacy from '../../src/scanners/media/metadataPrivacyScan.js';
import * as stegoScan from '../../src/scanners/media/stegoScan.js';

jest.mock('../../src/exec', () => ({
  execAsync: jest.fn().mockResolvedValue({ stdout: 'media pass', stderr: '', code: 0 })
}));

describe('Media Scanners', () => {
  it('runs content safety scan', async () => {
    await expect(contentSafety.run('file.jpg')).resolves.not.toThrow();
  });
  it('runs hash integrity scan', async () => {
    await expect(hashIntegrity.run('file.jpg')).resolves.not.toThrow();
  });
  it('runs image/video scan', async () => {
    await expect(imageVideo.run('file.jpg')).resolves.not.toThrow();
  });
  it('runs metadata privacy scan', async () => {
    await expect(metadataPrivacy.run('file.jpg')).resolves.not.toThrow();
  });
  it('runs stego scan', async () => {
    await expect(stegoScan.run('file.jpg')).resolves.not.toThrow();
  });
});
