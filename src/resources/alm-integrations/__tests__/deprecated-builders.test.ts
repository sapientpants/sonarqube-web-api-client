import { DeprecationManager } from '../../../core/deprecation';
import { BitbucketCloudReposSearchBuilder } from '../builders';

describe('ALM Integration Deprecated Builders', () => {
  let consoleSpy: jest.SpyInstance;
  let mockExecutor: jest.Mock;

  beforeEach(() => {
    // Reset warnings and configure for testing
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockExecutor = jest.fn().mockResolvedValue({ repositories: [] });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('BitbucketCloudReposSearchBuilder', () => {
    it('should show deprecation warning for withRepositoryName()', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      builder.withAlmSetting('alm-bitbucket-cloud').withRepositoryName('my-repo');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('BitbucketCloudReposSearchBuilder.withRepositoryName()')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('withRepoSlug()'));
    });

    it('should only show deprecation warning once', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      builder
        .withAlmSetting('alm-bitbucket-cloud')
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .withRepositoryName('repo1')
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .withRepositoryName('repo2')
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .withRepositoryName('repo3');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should still function correctly despite deprecation', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      const response = await builder
        .withAlmSetting('alm-bitbucket-cloud')
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .withRepositoryName('my-repo')
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        almSetting: 'alm-bitbucket-cloud',
        repositoryName: 'my-repo',
      });
      expect(response).toEqual({ repositories: [] });
    });
  });
});
