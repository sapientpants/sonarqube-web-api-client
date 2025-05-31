/**
 * Tests for PlatformValidationService
 */

import { PlatformValidationService, DevOpsPlatform } from '../PlatformValidationService';

describe('PlatformValidationService', () => {
  describe('validate', () => {
    it('should validate GitHub configuration successfully', () => {
      const result = PlatformValidationService.validate(
        {
          platform: DevOpsPlatform.GITHUB,
          identifier: 'owner/repository',
        },
        {
          owner: 'owner',
          repository: 'repository',
        }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation for missing required GitHub fields', () => {
      const result = PlatformValidationService.validate(
        {
          platform: DevOpsPlatform.GITHUB,
          identifier: 'owner/repository',
        },
        {
          owner: 'owner',
          // Missing repository
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'platformSpecific.repository',
        message: 'Repository is required for github',
        code: 'MISSING_GITHUB_REPOSITORY',
        platform: DevOpsPlatform.GITHUB,
      });
    });

    it('should warn about incorrect identifier format', () => {
      const result = PlatformValidationService.validate(
        {
          platform: DevOpsPlatform.GITHUB,
          identifier: 'invalid-format',
        },
        {
          owner: 'owner',
          repository: 'repository',
        }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        field: 'identifier',
        message: 'github identifier should be in format "owner/repository"',
        suggestion: 'owner/repository',
        platform: DevOpsPlatform.GITHUB,
      });
    });

    it('should handle unsupported platform', () => {
      const result = PlatformValidationService.validate(
        {
          platform: 'unsupported' as DevOpsPlatform,
          identifier: 'test',
        },
        {}
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'platform',
        message: 'Unsupported DevOps platform: unsupported',
        code: 'UNSUPPORTED_PLATFORM',
      });
    });

    it('should warn about spaces in field names', () => {
      const result = PlatformValidationService.validate(
        {
          platform: DevOpsPlatform.GITHUB,
          identifier: 'owner/repository',
        },
        {
          owner: 'owner with spaces',
          repository: 'repository',
        }
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        field: 'platformSpecific.owner',
        message: 'GitHub owner should not contain spaces',
        platform: DevOpsPlatform.GITHUB,
      });
    });
  });

  describe('validateGitHub', () => {
    it('should validate valid GitHub configuration', () => {
      const result = PlatformValidationService.validateGitHub(
        {
          owner: 'octocat',
          repository: 'hello-world',
          branch: 'main',
        },
        'octocat/hello-world'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation for empty owner', () => {
      const result = PlatformValidationService.validateGitHub(
        {
          owner: '',
          repository: 'hello-world',
        },
        'owner/hello-world'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('platformSpecific.owner');
    });
  });

  describe('validateGitLab', () => {
    it('should validate valid GitLab configuration', () => {
      const result = PlatformValidationService.validateGitLab(
        {
          namespace: 'gitlab-org',
          project: 'gitlab',
          branch: 'main',
        },
        'gitlab-org/gitlab'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate all required fields', () => {
      const result = PlatformValidationService.validateGitLab(
        {
          namespace: 'gitlab-org',
          // Missing project
        },
        'gitlab-org/gitlab'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_GITLAB_PROJECT');
    });
  });

  describe('validateBitbucket', () => {
    it('should validate valid Bitbucket configuration', () => {
      const result = PlatformValidationService.validateBitbucket(
        {
          workspace: 'atlassian',
          repository: 'bitbucket',
          branch: 'master',
        },
        'atlassian/bitbucket'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate required fields', () => {
      const result = PlatformValidationService.validateBitbucket(
        {
          workspace: 'atlassian',
          repository: '',
        },
        'atlassian/bitbucket'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_BITBUCKET_REPOSITORY');
    });
  });

  describe('validateAzureDevOps', () => {
    it('should validate valid Azure DevOps configuration', () => {
      const result = PlatformValidationService.validateAzureDevOps(
        {
          organization: 'microsoft',
          project: 'vscode',
          repository: 'vscode',
          branch: 'main',
        },
        'microsoft/vscode'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate all required fields', () => {
      const result = PlatformValidationService.validateAzureDevOps(
        {
          organization: 'microsoft',
          project: 'vscode',
          // Missing repository
        },
        'microsoft/vscode'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_AZURE_DEVOPS_REPOSITORY');
    });
  });

  describe('buildIdentifier', () => {
    it('should build GitHub identifier', () => {
      const identifier = PlatformValidationService.buildIdentifier(DevOpsPlatform.GITHUB, {
        owner: 'octocat',
        repository: 'hello-world',
      });

      expect(identifier).toBe('octocat/hello-world');
    });

    it('should build GitLab identifier', () => {
      const identifier = PlatformValidationService.buildIdentifier(DevOpsPlatform.GITLAB, {
        namespace: 'gitlab-org',
        project: 'gitlab',
      });

      expect(identifier).toBe('gitlab-org/gitlab');
    });

    it('should build Bitbucket identifier', () => {
      const identifier = PlatformValidationService.buildIdentifier(DevOpsPlatform.BITBUCKET, {
        workspace: 'atlassian',
        repository: 'bitbucket',
      });

      expect(identifier).toBe('atlassian/bitbucket');
    });

    it('should build Azure DevOps identifier', () => {
      const identifier = PlatformValidationService.buildIdentifier(DevOpsPlatform.AzureDevops, {
        organization: 'microsoft',
        project: 'vscode',
      });

      expect(identifier).toBe('microsoft/vscode');
    });

    it('should return undefined for missing fields', () => {
      const identifier = PlatformValidationService.buildIdentifier(DevOpsPlatform.GITHUB, {
        owner: 'octocat',
        // Missing repository
      });

      expect(identifier).toBeUndefined();
    });

    it('should return undefined for unknown platform', () => {
      const identifier = PlatformValidationService.buildIdentifier('unknown' as DevOpsPlatform, {});

      expect(identifier).toBeUndefined();
    });
  });
});
