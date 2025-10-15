// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Mock, MockInstance } from 'vitest';
import { DeprecationManager } from '../../../../src/core/deprecation';
import { BitbucketCloudReposSearchBuilder } from '../../../../src/resources/alm-integrations/builders';

describe('ALM Integration Deprecated Builders', () => {
  let consoleSpy: MockInstance;
  let mockExecutor: Mock;

  beforeEach(() => {
    // Reset warnings and configure for testing
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    mockExecutor = vi.fn().mockResolvedValue({ repositories: [] });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('BitbucketCloudReposSearchBuilder', () => {
    it('should show deprecation warning for withRepositoryName()', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      builder.withAlmSetting('alm-bitbucket-cloud').withRepositoryName('my-repo');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('BitbucketCloudReposSearchBuilder.withRepositoryName()'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('withRepoSlug()'));
    });

    it('should only show deprecation warning once', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      builder
        .withAlmSetting('alm-bitbucket-cloud')

        .withRepositoryName('repo1')

        .withRepositoryName('repo2')

        .withRepositoryName('repo3');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should still function correctly despite deprecation', async () => {
      const builder = new BitbucketCloudReposSearchBuilder(mockExecutor);

      const response = await builder
        .withAlmSetting('alm-bitbucket-cloud')

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
