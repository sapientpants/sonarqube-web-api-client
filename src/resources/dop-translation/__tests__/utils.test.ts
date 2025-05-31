/**
 * Tests for DOP Translation utilities
 * Testing platform detection, validation, mapping, and authentication helpers
 */

import {
  PlatformDetector,
  ConfigurationValidator,
  ProjectMapper,
  AuthenticationHelper,
  ConfigurationTemplates,
} from '../utils';
import {
  DevOpsPlatform,
  ProjectVisibility,
  type GitHubConfig,
  type GitLabConfig,
  type BitbucketConfig,
  type AzureDevOpsConfig,
} from '../types';

describe('PlatformDetector', () => {
  describe('detectFromUrl', () => {
    it('should detect GitHub.com URLs', () => {
      const testCases = [
        'https://github.com/owner/repo',
        'https://www.github.com/owner/repo',
        'http://github.com/owner/repo',
        'github.com/owner/repo',
      ];

      testCases.forEach((url) => {
        const result = PlatformDetector.detectFromUrl(url);

        expect(result.platform).toBe(DevOpsPlatform.GITHUB);
        expect(result.confidence).toBe(1.0);
        expect(result.extractedInfo.organization).toBe('owner');
        expect(result.extractedInfo.repository).toBe('repo');
        expect(result.extractedInfo.isEnterprise).toBe(false);
      });
    });

    it('should detect GitHub Enterprise URLs', () => {
      const url = 'https://github.company.com/owner/repo';
      const result = PlatformDetector.detectFromUrl(url);

      expect(result.platform).toBe(DevOpsPlatform.GITHUB);
      expect(result.confidence).toBe(0.6);
      expect(result.extractedInfo.organization).toBe('owner');
      expect(result.extractedInfo.repository).toBe('repo');
      expect(result.extractedInfo.isEnterprise).toBe(true);
      expect(result.extractedInfo.apiUrl).toBe('https://github.company.com/api/v3');
    });

    it('should detect GitLab.com URLs', () => {
      const testCases = [
        'https://gitlab.com/namespace/project',
        'https://www.gitlab.com/namespace/project',
        'http://gitlab.com/namespace/project',
        'gitlab.com/namespace/project',
      ];

      testCases.forEach((url) => {
        const result = PlatformDetector.detectFromUrl(url);

        expect(result.platform).toBe(DevOpsPlatform.GITLAB);
        expect(result.confidence).toBe(1.0);
        expect(result.extractedInfo.organization).toBe('namespace');
        expect(result.extractedInfo.repository).toBe('project');
        expect(result.extractedInfo.isEnterprise).toBe(false);
      });
    });

    it('should detect GitLab Enterprise URLs', () => {
      const url = 'https://gitlab.company.com/namespace/project';
      const result = PlatformDetector.detectFromUrl(url);

      expect(result.platform).toBe(DevOpsPlatform.GITLAB);
      expect(result.confidence).toBe(0.7);
      expect(result.extractedInfo.organization).toBe('namespace');
      expect(result.extractedInfo.repository).toBe('project');
      expect(result.extractedInfo.isEnterprise).toBe(true);
      expect(result.extractedInfo.apiUrl).toBe('https://gitlab.company.com/api/v4');
    });

    it('should detect Bitbucket URLs', () => {
      const testCases = [
        'https://bitbucket.org/workspace/repo',
        'https://www.bitbucket.org/workspace/repo',
        'http://bitbucket.org/workspace/repo',
        'bitbucket.org/workspace/repo',
      ];

      testCases.forEach((url) => {
        const result = PlatformDetector.detectFromUrl(url);

        expect(result.platform).toBe(DevOpsPlatform.BITBUCKET);
        expect(result.confidence).toBe(1.0);
        expect(result.extractedInfo.organization).toBe('workspace');
        expect(result.extractedInfo.repository).toBe('repo');
        expect(result.extractedInfo.isEnterprise).toBe(false);
      });
    });

    it('should detect Azure DevOps URLs', () => {
      const testCases = [
        'https://dev.azure.com/organization/project',
        'http://dev.azure.com/organization/project',
        'dev.azure.com/organization/project',
      ];

      testCases.forEach((url) => {
        const result = PlatformDetector.detectFromUrl(url);

        expect(result.platform).toBe(DevOpsPlatform.AzureDevops);
        expect(result.confidence).toBe(1.0);
        expect(result.extractedInfo.organization).toBe('organization');
        expect(result.extractedInfo.repository).toBe('project');
        expect(result.extractedInfo.isEnterprise).toBe(false);
      });
    });

    it('should detect Azure DevOps legacy URLs', () => {
      const url = 'https://company.visualstudio.com/project';
      const result = PlatformDetector.detectFromUrl(url);

      expect(result.platform).toBe(DevOpsPlatform.AzureDevops);
      expect(result.confidence).toBe(0.9);
      expect(result.extractedInfo.organization).toBe('company');
      expect(result.extractedInfo.repository).toBe('project');
      expect(result.extractedInfo.isEnterprise).toBe(true);
    });

    it('should handle URLs with .git suffix', () => {
      const url = 'https://github.com/owner/repo.git';
      const result = PlatformDetector.detectFromUrl(url);

      expect(result.extractedInfo.repository).toBe('repo');
    });

    it('should return low confidence for unknown URLs', () => {
      const url = 'https://unknown-platform.com/';
      const result = PlatformDetector.detectFromUrl(url);

      expect(result.platform).toBe(DevOpsPlatform.GITHUB); // Default fallback
      expect(result.confidence).toBe(0.0);
      expect(result.extractedInfo.url).toBe(url);
    });
  });

  describe('extractProjectInfo', () => {
    it('should extract project info for known platform', () => {
      const url = 'https://github.com/test/repo';
      const result = PlatformDetector.extractProjectInfo(url, DevOpsPlatform.GITHUB);

      expect(result.organization).toBe('test');
      expect(result.repository).toBe('repo');
      expect(result.url).toBe(url);
    });

    it('should return basic info for mismatched platform', () => {
      const url = 'https://gitlab.com/test/repo';
      const result = PlatformDetector.extractProjectInfo(url, DevOpsPlatform.GITHUB);

      expect(result.url).toBe(url);
      expect(result.organization).toBeUndefined();
      expect(result.repository).toBeUndefined();
    });
  });
});

describe('ConfigurationValidator', () => {
  describe('validateGitHubConfig', () => {
    it('should validate valid GitHub configuration', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'valid-owner',
        repository: 'valid-repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitHubConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing owner', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: '',
        repository: 'repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitHubConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'owner',
            message: 'GitHub owner/organization is required',
            code: 'MISSING_GITHUB_OWNER',
          }),
        ])
      );
    });

    it('should reject missing repository', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: '',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitHubConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'repository',
            message: 'GitHub repository name is required',
            code: 'MISSING_GITHUB_REPO',
          }),
        ])
      );
    });

    it('should warn about naming convention violations', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: '-invalid-owner-',
        repository: 'repo@invalid',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitHubConfig(config);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'owner',
            message: 'GitHub owner name should follow naming conventions',
          }),
          expect.objectContaining({
            field: 'repository',
            message: 'GitHub repository name should follow naming conventions',
          }),
        ])
      );
    });
  });

  describe('validateGitLabConfig', () => {
    it('should validate valid GitLab configuration', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: 'valid-namespace',
        project: 'valid-project',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitLabConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing namespace', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: '',
        project: 'project',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateGitLabConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'namespace',
            message: 'GitLab namespace is required',
            code: 'MISSING_GITLAB_NAMESPACE',
          }),
        ])
      );
    });
  });

  describe('validateBitbucketConfig', () => {
    it('should validate valid Bitbucket configuration', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: 'valid-workspace',
        repository: 'valid-repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateBitbucketConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing workspace', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: '',
        repository: 'repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateBitbucketConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workspace',
            message: 'Bitbucket workspace is required',
            code: 'MISSING_BITBUCKET_WORKSPACE',
          }),
        ])
      );
    });
  });

  describe('validateAzureDevOpsConfig', () => {
    it('should validate valid Azure DevOps configuration', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: 'valid-org',
        project: 'valid-project',
        repository: 'valid-repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateAzureDevOpsConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing organization', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: '',
        project: 'project',
        repository: 'repo',
        defaultBranch: 'main',
      };

      const result = ConfigurationValidator.validateAzureDevOpsConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'organization',
            message: 'Azure DevOps organization is required',
            code: 'MISSING_AZURE_ORG',
          }),
        ])
      );
    });
  });
});

describe('ProjectMapper', () => {
  describe('mapGitHubProject', () => {
    it('should map GitHub project to SonarQube config', () => {
      const githubProject = {
        owner: { login: 'github-owner' },
        name: 'awesome-repo',
        description: 'An awesome repository',
        private: true,
        topics: ['javascript', 'react', 'web'],
      };

      const result = ProjectMapper.mapGitHubProject(githubProject);

      expect(result).toEqual({
        key: 'github-owner_awesome-repo',
        name: 'awesome-repo',
        description: 'An awesome repository',
        visibility: ProjectVisibility.PRIVATE,
        tags: ['javascript', 'react', 'web'],
      });
    });

    it('should handle public GitHub repository', () => {
      const githubProject = {
        owner: { login: 'github-owner' },
        name: 'public-repo',
        description: null,
        private: false,
        topics: [],
      };

      const result = ProjectMapper.mapGitHubProject(githubProject);

      expect(result.visibility).toBe(ProjectVisibility.PUBLIC);
      expect('description' in result).toBe(false); // Not set when null
      expect(result.tags).toEqual([]);
    });
  });

  describe('mapGitLabProject', () => {
    it('should map GitLab project to SonarQube config', () => {
      const gitlabProject = {
        path_with_namespace: 'group/sub-group/project',
        name: 'GitLab Project',
        description: 'A GitLab project',
        visibility: 'private',
        tag_list: ['python', 'api'],
      };

      const result = ProjectMapper.mapGitLabProject(gitlabProject);

      expect(result).toEqual({
        key: 'group_sub-group_project',
        name: 'GitLab Project',
        description: 'A GitLab project',
        visibility: ProjectVisibility.PRIVATE,
        tags: ['python', 'api'],
      });
    });

    it('should handle public GitLab repository', () => {
      const gitlabProject = {
        path_with_namespace: 'user/public-project',
        name: 'Public Project',
        description: '',
        visibility: 'public',
        tag_list: null,
      };

      const result = ProjectMapper.mapGitLabProject(gitlabProject);

      expect(result.visibility).toBe(ProjectVisibility.PUBLIC);
      expect(result.tags).toEqual([]);
    });
  });

  describe('mapBitbucketProject', () => {
    it('should map Bitbucket project to SonarQube config', () => {
      const bitbucketProject = {
        workspace: { slug: 'workspace-name' },
        slug: 'repo-slug',
        name: 'Repository Name',
        description: 'Repository description',
        is_private: true,
      };

      const result = ProjectMapper.mapBitbucketProject(bitbucketProject);

      expect(result).toEqual({
        key: 'workspace-name_repo-slug',
        name: 'Repository Name',
        description: 'Repository description',
        visibility: ProjectVisibility.PRIVATE,
        tags: [],
      });
    });
  });

  describe('mapAzureDevOpsProject', () => {
    it('should map Azure DevOps project to SonarQube config', () => {
      const azureProject = {
        organization: 'azure-org',
        name: 'Project Name',
        description: 'Project description',
        visibility: 'private',
      };

      const result = ProjectMapper.mapAzureDevOpsProject(azureProject);

      expect(result).toEqual({
        key: 'azure-org_Project Name',
        name: 'Project Name',
        description: 'Project description',
        visibility: ProjectVisibility.PRIVATE,
        tags: [],
      });
    });
  });

  describe('generateProjectKey', () => {
    it('should generate project key for different platforms', () => {
      const testCases = [
        {
          platform: DevOpsPlatform.GITHUB,
          org: 'github-org',
          repo: 'repo-name',
          expected: 'github_github_org_repo_name',
        },
        {
          platform: DevOpsPlatform.GITLAB,
          org: 'gitlab-group',
          repo: 'project-name',
          expected: 'gitlab_gitlab_group_project_name',
        },
        {
          platform: DevOpsPlatform.BITBUCKET,
          org: 'bitbucket-workspace',
          repo: 'repo-name',
          expected: 'bitbucket_bitbucket_workspace_repo_name',
        },
        {
          platform: DevOpsPlatform.AzureDevops,
          org: 'azure-org',
          repo: 'repo-name',
          expected: 'azure_devops_azure_org_repo_name',
        },
      ];

      testCases.forEach(({ platform, org, repo, expected }) => {
        const result = ProjectMapper.generateProjectKey(platform, org, repo);
        expect(result).toBe(expected);
      });
    });

    it('should clean special characters', () => {
      const result = ProjectMapper.generateProjectKey(
        DevOpsPlatform.GITHUB,
        'org-with@special.chars',
        'repo-with#special$chars'
      );

      expect(result).toBe('github_org_with_special_chars_repo_with_special_chars');
    });
  });
});

describe('AuthenticationHelper', () => {
  describe('validateGitHubAuth', () => {
    it('should validate GitHub personal access token', async () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: 'repo',
      };

      const credentials = {
        type: 'personal_access_token' as const,
        token: 'ghp_1234567890abcdef',
      };

      const result = AuthenticationHelper.validateGitHubAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should reject invalid GitHub token format', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: 'repo',
      };

      const credentials = {
        type: 'personal_access_token' as const,
        token: 'invalid-token',
      };

      const result = AuthenticationHelper.validateGitHubAuth(config, credentials);
      expect(result).toBe(false);
    });

    it('should validate GitHub OAuth credentials', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: 'repo',
      };

      const credentials = {
        type: 'oauth' as const,
        clientId: 'client123',
        clientSecret: 'secret456',
      };

      const result = AuthenticationHelper.validateGitHubAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should validate GitHub installation token', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: 'repo',
      };

      const credentials = {
        type: 'installation_token' as const,
        installationId: '12345',
        appId: 'app123',
        privateKey: 'private-key',
      };

      const result = AuthenticationHelper.validateGitHubAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should reject GitHub app passwords', () => {
      const config: GitHubConfig = {
        type: 'github',
        owner: 'owner',
        repository: 'repo',
      };

      const credentials = {
        type: 'app_password' as const,
        username: 'user',
        password: 'pass',
      };

      const result = AuthenticationHelper.validateGitHubAuth(config, credentials);
      expect(result).toBe(false);
    });
  });

  describe('validateGitLabAuth', () => {
    it('should validate GitLab personal access token', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: 'namespace',
        project: 'project',
      };

      const credentials = {
        type: 'personal_access_token' as const,
        token: 'glpat-1234567890abcdefghij', // 20+ chars
      };

      const result = AuthenticationHelper.validateGitLabAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should validate GitLab OAuth credentials', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: 'namespace',
        project: 'project',
      };

      const credentials = {
        type: 'oauth' as const,
        clientId: 'client123',
        clientSecret: 'secret456',
      };

      const result = AuthenticationHelper.validateGitLabAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should reject GitLab app password', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: 'namespace',
        project: 'project',
      };

      const credentials = {
        type: 'app_password' as const,
        username: 'user',
        password: 'pass',
      };

      const result = AuthenticationHelper.validateGitLabAuth(config, credentials);
      expect(result).toBe(false);
    });

    it('should reject GitLab installation token', () => {
      const config: GitLabConfig = {
        type: 'gitlab',
        namespace: 'namespace',
        project: 'project',
      };

      const credentials = {
        type: 'installation_token' as const,
        installationId: '12345',
        appId: 'app123',
        privateKey: 'private-key',
      };

      const result = AuthenticationHelper.validateGitLabAuth(config, credentials);
      expect(result).toBe(false);
    });
  });

  describe('validateBitbucketAuth', () => {
    it('should validate Bitbucket app password', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: 'workspace',
        repository: 'repo',
      };

      const credentials = {
        type: 'app_password' as const,
        username: 'user',
        password: 'pass',
      };

      const result = AuthenticationHelper.validateBitbucketAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should validate Bitbucket OAuth credentials', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: 'workspace',
        repository: 'repo',
      };

      const credentials = {
        type: 'oauth' as const,
        clientId: 'client123',
        clientSecret: 'secret456',
      };

      const result = AuthenticationHelper.validateBitbucketAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should reject Bitbucket personal access token', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: 'workspace',
        repository: 'repo',
      };

      const credentials = {
        type: 'personal_access_token' as const,
        token: 'token123',
      };

      const result = AuthenticationHelper.validateBitbucketAuth(config, credentials);
      expect(result).toBe(false);
    });

    it('should reject Bitbucket installation token', () => {
      const config: BitbucketConfig = {
        type: 'bitbucket',
        workspace: 'workspace',
        repository: 'repo',
      };

      const credentials = {
        type: 'installation_token' as const,
        installationId: '12345',
        appId: 'app123',
        privateKey: 'private-key',
      };

      const result = AuthenticationHelper.validateBitbucketAuth(config, credentials);
      expect(result).toBe(false);
    });
  });

  describe('validateAzureDevOpsAuth', () => {
    it('should validate Azure DevOps personal access token', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: 'org',
        project: 'project',
        repository: 'repo',
      };

      const credentials = {
        type: 'personal_access_token' as const,
        token: '1234567890123456789012345678901234567890123456789012', // 52+ chars
      };

      const result = AuthenticationHelper.validateAzureDevOpsAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should validate Azure DevOps OAuth credentials', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: 'org',
        project: 'project',
        repository: 'repo',
      };

      const credentials = {
        type: 'oauth' as const,
        clientId: 'client123',
        clientSecret: 'secret456',
      };

      const result = AuthenticationHelper.validateAzureDevOpsAuth(config, credentials);
      expect(result).toBe(true);
    });

    it('should reject Azure DevOps app password', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: 'org',
        project: 'project',
        repository: 'repo',
      };

      const credentials = {
        type: 'app_password' as const,
        username: 'user',
        password: 'pass',
      };

      const result = AuthenticationHelper.validateAzureDevOpsAuth(config, credentials);
      expect(result).toBe(false);
    });

    it('should reject Azure DevOps installation token', () => {
      const config: AzureDevOpsConfig = {
        type: 'azure-devops',
        organization: 'org',
        project: 'project',
        repository: 'repo',
      };

      const credentials = {
        type: 'installation_token' as const,
        installationId: '12345',
        appId: 'app123',
        privateKey: 'private-key',
      };

      const result = AuthenticationHelper.validateAzureDevOpsAuth(config, credentials);
      expect(result).toBe(false);
    });
  });

  describe('getRequiredScopes', () => {
    it('should return correct scopes for GitHub read operations', () => {
      const scopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITHUB, ['read']);

      expect(scopes).toEqual(['repo:status', 'public_repo']);
    });

    it('should return correct scopes for GitHub write operations', () => {
      const scopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITHUB, ['write']);

      expect(scopes).toEqual(['repo']);
    });

    it('should return combined scopes for multiple operations', () => {
      const scopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITHUB, [
        'read',
        'admin',
      ]);

      expect(scopes).toContain('repo:status');
      expect(scopes).toContain('public_repo');
      expect(scopes).toContain('repo');
      expect(scopes).toContain('admin:repo_hook');
    });

    it('should deduplicate scopes', () => {
      const scopes = AuthenticationHelper.getRequiredScopes(
        DevOpsPlatform.GITHUB,
        ['read', 'write'] // 'repo' is included in both
      );

      const repoCount = scopes.filter((scope) => scope === 'repo').length;
      expect(repoCount).toBe(1);
    });

    it('should return correct scopes for GitLab operations', () => {
      const readScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITLAB, ['read']);
      expect(readScopes).toEqual(['read_repository']);

      const writeScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITLAB, ['write']);
      expect(writeScopes).toEqual(['write_repository']);

      const adminScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.GITLAB, ['admin']);
      expect(adminScopes).toEqual(['api']);
    });

    it('should return correct scopes for Bitbucket operations', () => {
      const readScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.BITBUCKET, ['read']);
      expect(readScopes).toEqual(['repositories:read']);

      const writeScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.BITBUCKET, [
        'write',
      ]);
      expect(writeScopes).toEqual(['repositories:write']);

      const adminScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.BITBUCKET, [
        'admin',
      ]);
      expect(adminScopes).toEqual(['repositories:admin']);
    });

    it('should return correct scopes for Azure DevOps operations', () => {
      const readScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.AzureDevops, [
        'read',
      ]);
      expect(readScopes).toEqual(['vso.code']);

      const writeScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.AzureDevops, [
        'write',
      ]);
      expect(writeScopes).toEqual(['vso.code_write']);

      const adminScopes = AuthenticationHelper.getRequiredScopes(DevOpsPlatform.AzureDevops, [
        'admin',
      ]);
      expect(adminScopes).toEqual(['vso.code_manage']);
    });
  });
});

describe('ConfigurationTemplates', () => {
  describe('getDefaultConfig', () => {
    it('should return default GitHub configuration', () => {
      const config = ConfigurationTemplates.getDefaultConfig(
        DevOpsPlatform.GITHUB,
        'github-org',
        'repo-name'
      );

      expect(config).toEqual({
        type: 'github',
        owner: 'github-org',
        repository: 'repo-name',
        defaultBranch: 'main',
      });
    });

    it('should return default GitLab configuration', () => {
      const config = ConfigurationTemplates.getDefaultConfig(
        DevOpsPlatform.GITLAB,
        'gitlab-group',
        'project-name'
      );

      expect(config).toEqual({
        type: 'gitlab',
        namespace: 'gitlab-group',
        project: 'project-name',
        defaultBranch: 'main',
      });
    });

    it('should return default Bitbucket configuration', () => {
      const config = ConfigurationTemplates.getDefaultConfig(
        DevOpsPlatform.BITBUCKET,
        'workspace',
        'repo-name'
      );

      expect(config).toEqual({
        type: 'bitbucket',
        workspace: 'workspace',
        repository: 'repo-name',
        defaultBranch: 'main',
      });
    });

    it('should return default Azure DevOps configuration', () => {
      const config = ConfigurationTemplates.getDefaultConfig(
        DevOpsPlatform.AzureDevops,
        'azure-org',
        'repo-name'
      );

      expect(config).toEqual({
        type: 'azure-devops',
        organization: 'azure-org',
        project: 'azure-org',
        repository: 'repo-name',
        defaultBranch: 'main',
      });
    });

    it('should throw error for unsupported platform', () => {
      expect(() => {
        ConfigurationTemplates.getDefaultConfig('unsupported' as DevOpsPlatform, 'org', 'repo');
      }).toThrow('Unsupported platform: unsupported');
    });
  });

  describe('getSonarQubeTemplate', () => {
    it('should return minimal template', () => {
      const template = ConfigurationTemplates.getSonarQubeTemplate('minimal');

      expect(template).toEqual({
        visibility: ProjectVisibility.PRIVATE,
      });
    });

    it('should return standard template', () => {
      const template = ConfigurationTemplates.getSonarQubeTemplate('standard');

      expect(template).toEqual({
        visibility: ProjectVisibility.PRIVATE,
        qualityGate: 'Sonar way',
        tags: ['automated'],
      });
    });

    it('should return enterprise template', () => {
      const template = ConfigurationTemplates.getSonarQubeTemplate('enterprise');

      expect(template).toEqual({
        visibility: ProjectVisibility.PRIVATE,
        qualityGate: 'Enterprise Quality Gate',
        tags: ['automated', 'enterprise'],
        settings: {
          'sonar.exclusions': '**/vendor/**,**/node_modules/**',
          'sonar.coverage.exclusions': '**/*test*/**,**/*spec*/**',
        },
      });
    });
  });
});
