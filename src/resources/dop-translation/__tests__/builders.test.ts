/**
 * Tests for DOP Translation builders
 * Testing fluent builder patterns for creating bound projects
 */

import { CreateBoundProjectV2BuilderImpl } from '../builders';
import { DopTranslationClient } from '../DopTranslationClient';
import type { CreateBoundProjectV2Response } from '../types';
import { DevOpsPlatform, ProjectVisibility, ProjectBindingStatus, SyncStatus } from '../types';

// Mock DopTranslationClient
jest.mock('../DopTranslationClient');

describe('CreateBoundProjectV2BuilderImpl', () => {
  let client: DopTranslationClient;
  let builder: CreateBoundProjectV2BuilderImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DopTranslationClient('https://sonarqube.example.com', 'test-token');
    builder = new CreateBoundProjectV2BuilderImpl(client);
  });

  describe('GitHub configuration', () => {
    it('should build a complete GitHub project configuration', async () => {
      // Arrange
      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-123',
        key: 'acme_api-service',
        name: 'ACME API Service',
        url: 'https://sonarqube.example.com/dashboard?id=acme_api-service',
        dopBinding: {
          id: 'binding-123',
          platform: DevOpsPlatform.GITHUB,
          externalProjectId: 'acme-corp/api-service',
          externalUrl: 'https://github.com/acme-corp/api-service',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'github',
            owner: 'acme-corp',
            repository: 'api-service',
            defaultBranch: 'main',
            installationId: '12345',
          },
        },
        sonarQubeProject: {
          key: 'acme_api-service',
          name: 'ACME API Service',
          url: 'https://sonarqube.example.com/dashboard?id=acme_api-service',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      (client.createBoundProjectV2 as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('acme-corp/api-service')
        .withGitHubConfig({
          owner: 'acme-corp',
          repository: 'api-service',
          defaultBranch: 'main',
          installationId: '12345',
        })
        .withSonarQubeProject({
          name: 'ACME API Service',
          description: 'Core API microservice for ACME Corp',
          visibility: ProjectVisibility.PRIVATE,
          qualityGate: 'Sonar way',
          tags: ['microservice', 'api', 'backend'],
        })
        .execute();

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(jest.mocked(client.createBoundProjectV2)).toHaveBeenCalledWith({
        dopPlatform: DevOpsPlatform.GITHUB,
        projectIdentifier: 'acme-corp/api-service',
        organizationName: 'acme-corp',
        repositoryName: 'api-service',
        platformSpecific: {
          type: 'github',
          owner: 'acme-corp',
          repository: 'api-service',
          defaultBranch: 'main',
          installationId: '12345',
        },
        sonarQubeProjectConfig: {
          name: 'ACME API Service',
          description: 'Core API microservice for ACME Corp',
          visibility: ProjectVisibility.PRIVATE,
          qualityGate: 'Sonar way',
          tags: ['microservice', 'api', 'backend'],
        },
      });
    });

    it('should auto-extract organization and repository from project identifier', async () => {
      // Act
      builder.withProjectIdentifier('github-org/awesome-repo');

      // Assert
      const validation = await builder.validate();
      expect(validation).toMatchObject({
        valid: false, // Still invalid because platform not set
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'dopPlatform',
          }),
        ]),
      });
    });

    it('should auto-set platform when using GitHub config', () => {
      // Act
      builder.withGitHubConfig({
        owner: 'test-org',
        repository: 'test-repo',
      });

      // Get internal request object for verification
      const internalRequest = (builder as any).request;

      // Assert
      expect(internalRequest.dopPlatform).toBe(DevOpsPlatform.GITHUB);
      expect(internalRequest.platformSpecific).toEqual({
        type: 'github',
        owner: 'test-org',
        repository: 'test-repo',
        defaultBranch: 'main',
      });
    });
  });

  describe('GitLab configuration', () => {
    it('should build a complete GitLab project configuration', async () => {
      // Arrange
      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-124',
        key: 'frontend-team_react-dashboard',
        name: 'React Dashboard',
        url: 'https://sonarqube.example.com/dashboard?id=frontend-team_react-dashboard',
        dopBinding: {
          id: 'binding-124',
          platform: DevOpsPlatform.GITLAB,
          externalProjectId: 'frontend-team/react-dashboard',
          externalUrl: 'https://gitlab.com/frontend-team/react-dashboard',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'gitlab',
            namespace: 'frontend-team',
            project: 'react-dashboard',
            projectId: 98765,
            groupId: 1234,
            defaultBranch: 'develop',
          },
        },
        sonarQubeProject: {
          key: 'frontend-team_react-dashboard',
          name: 'React Dashboard',
          url: 'https://sonarqube.example.com/dashboard?id=frontend-team_react-dashboard',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      (client.createBoundProjectV2 as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await builder
        .forPlatform(DevOpsPlatform.GITLAB)
        .withProjectIdentifier('frontend-team/react-dashboard')
        .withMainBranch('develop')
        .withGitLabConfig({
          namespace: 'frontend-team',
          project: 'react-dashboard',
          projectId: 98765,
          groupId: 1234,
          defaultBranch: 'develop',
        })
        .withSonarQubeProject({
          key: 'frontend_react_dashboard',
          name: 'React Dashboard',
          description: 'Admin dashboard built with React',
          visibility: ProjectVisibility.PRIVATE,
          qualityProfile: {
            typescript: 'Sonar way TypeScript',
            javascript: 'Sonar way JavaScript',
          },
        })
        .execute();

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should auto-set platform when using GitLab config', () => {
      // Act
      builder.withGitLabConfig({
        namespace: 'test-group',
        project: 'test-project',
      });

      // Get internal request object for verification
      const internalRequest = (builder as any).request;

      // Assert
      expect(internalRequest.dopPlatform).toBe(DevOpsPlatform.GITLAB);
      expect(internalRequest.platformSpecific).toEqual({
        type: 'gitlab',
        namespace: 'test-group',
        project: 'test-project',
        defaultBranch: 'main',
      });
    });
  });

  describe('Bitbucket configuration', () => {
    it('should build a complete Bitbucket project configuration', async () => {
      // Arrange
      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-125',
        key: 'mobile-team_ios-app',
        name: 'iOS Mobile App',
        url: 'https://sonarqube.example.com/dashboard?id=mobile-team_ios-app',
        dopBinding: {
          id: 'binding-125',
          platform: DevOpsPlatform.BITBUCKET,
          externalProjectId: 'mobile-team/ios-app',
          externalUrl: 'https://bitbucket.org/mobile-team/ios-app',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'bitbucket',
            workspace: 'mobile-team',
            repository: 'ios-app',
            uuid: '{abcd-1234-efgh-5678}',
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'mobile-team_ios-app',
          name: 'iOS Mobile App',
          url: 'https://sonarqube.example.com/dashboard?id=mobile-team_ios-app',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      (client.createBoundProjectV2 as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await builder
        .forPlatform(DevOpsPlatform.BITBUCKET)
        .withProjectIdentifier('mobile-team/ios-app')
        .withBitbucketConfig({
          workspace: 'mobile-team',
          repository: 'ios-app',
          uuid: '{abcd-1234-efgh-5678}',
          defaultBranch: 'main',
        })
        .withSonarQubeProject({
          name: 'iOS Mobile App',
          visibility: ProjectVisibility.PRIVATE,
          qualityProfile: {
            swift: 'Sonar way Swift',
          },
          tags: ['mobile', 'ios', 'swift'],
        })
        .execute();

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should auto-set platform when using Bitbucket config', () => {
      // Act
      builder.withBitbucketConfig({
        workspace: 'test-workspace',
        repository: 'test-repo',
      });

      // Get internal request object for verification
      const internalRequest = (builder as any).request;

      // Assert
      expect(internalRequest.dopPlatform).toBe(DevOpsPlatform.BITBUCKET);
    });
  });

  describe('Azure DevOps configuration', () => {
    it('should build a complete Azure DevOps project configuration', async () => {
      // Arrange
      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-126',
        key: 'enterprise-org_core-services',
        name: 'Enterprise Core Services',
        url: 'https://sonarqube.example.com/dashboard?id=enterprise-org_core-services',
        dopBinding: {
          id: 'binding-126',
          platform: DevOpsPlatform.AZURE_DEVOPS,
          externalProjectId: 'enterprise-org/core-services',
          externalUrl: 'https://dev.azure.com/enterprise-org/Core%20Services/_git/core-services',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'azure-devops',
            organization: 'enterprise-org',
            project: 'Core Services',
            repository: 'core-services',
            projectId: 'abc123-def456-ghi789',
            repositoryId: 'xyz789-uvw456-rst123',
            defaultBranch: 'master',
          },
        },
        sonarQubeProject: {
          key: 'enterprise-org_core-services',
          name: 'Enterprise Core Services',
          url: 'https://sonarqube.example.com/dashboard?id=enterprise-org_core-services',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      (client.createBoundProjectV2 as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await builder
        .forPlatform(DevOpsPlatform.AZURE_DEVOPS)
        .withProjectIdentifier('enterprise-org/core-services')
        .withAzureDevOpsConfig({
          organization: 'enterprise-org',
          project: 'Core Services',
          repository: 'core-services',
          projectId: 'abc123-def456-ghi789',
          repositoryId: 'xyz789-uvw456-rst123',
          defaultBranch: 'master',
        })
        .withSonarQubeProject({
          name: 'Enterprise Core Services',
          description: 'Mission-critical enterprise services',
          visibility: ProjectVisibility.PRIVATE,
          qualityGate: 'Enterprise Quality Gate',
          settings: {
            'sonar.exclusions': '**/vendor/**,**/node_modules/**',
            'sonar.coverage.exclusions': '**/*test*/**',
          },
        })
        .execute();

      // Assert
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('fluent API chaining', () => {
    it('should support method chaining', () => {
      // Act
      const chainedBuilder = builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withOrganization('test')
        .withRepository('repo')
        .withRepositoryUrl('https://github.com/test/repo')
        .withMainBranch('main')
        .withProjectName('Test Project')
        .withProjectDescription('A test project')
        .withVisibility(ProjectVisibility.PRIVATE)
        .withQualityGate('Sonar way')
        .withTags(['test', 'sample']);

      // Assert
      expect(chainedBuilder).toBe(builder);
    });

    it('should update project identifier when organization and repository are set', () => {
      // Act
      builder.withOrganization('my-org').withRepository('my-repo');

      // Get internal request object for verification
      const internalRequest = (builder as any).request;

      // Assert
      expect(internalRequest.projectIdentifier).toBe('my-org/my-repo');
      expect(internalRequest.organizationName).toBe('my-org');
      expect(internalRequest.repositoryName).toBe('my-repo');
    });
  });

  describe('validation', () => {
    it('should validate required fields', async () => {
      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'dopPlatform',
            message: 'DevOps platform is required',
            code: 'MISSING_PLATFORM',
          }),
          expect.objectContaining({
            field: 'projectIdentifier',
            message: 'Project identifier is required',
            code: 'MISSING_PROJECT_ID',
          }),
        ])
      );
    });

    it('should validate GitHub-specific configuration', async () => {
      // Arrange
      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: '',
          repository: 'repo',
        });

      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'platformSpecific.owner',
            message: 'GitHub owner is required',
            code: 'MISSING_GITHUB_OWNER',
          }),
        ])
      );
    });

    it('should validate GitHub naming conventions', async () => {
      // Arrange
      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: 'invalid-owner-',
          repository: 'repo@invalid',
        });

      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'platformSpecific.owner',
            message: 'GitHub owner name may not follow naming conventions',
          }),
          expect.objectContaining({
            field: 'platformSpecific.repository',
            message: 'GitHub repository name may not follow naming conventions',
          }),
        ])
      );
    });

    it('should validate SonarQube project key format', async () => {
      // Arrange
      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: 'test',
          repository: 'repo',
        })
        .withProjectKey('invalid@key#format');

      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sonarQubeProjectConfig.key',
            message: 'Invalid SonarQube project key format',
            code: 'INVALID_PROJECT_KEY',
          }),
        ])
      );
    });

    it('should validate project key length', async () => {
      // Arrange
      const longKey = 'a'.repeat(401);

      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: 'test',
          repository: 'repo',
        })
        .withProjectKey(longKey);

      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sonarQubeProjectConfig.key',
            message: 'SonarQube project key too long (max 400 characters)',
            code: 'PROJECT_KEY_TOO_LONG',
          }),
        ])
      );
    });

    it('should pass validation with valid configuration', async () => {
      // Arrange
      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: 'test',
          repository: 'repo',
        });

      // Act
      const validation = await builder.validate();

      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('execute', () => {
    it('should throw validation error on invalid configuration', async () => {
      // Arrange
      builder.forPlatform(DevOpsPlatform.GITHUB);
      // Missing required project identifier

      // Act & Assert
      await expect(builder.execute()).rejects.toThrow(
        'Builder validation failed: Project identifier is required'
      );
    });

    it('should call client with valid configuration', async () => {
      // Arrange
      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-123',
        key: 'test_repo',
        name: 'repo',
        url: 'https://sonarqube.example.com/dashboard?id=test_repo',
        dopBinding: {
          id: 'binding-123',
          platform: DevOpsPlatform.GITHUB,
          externalProjectId: 'test/repo',
          externalUrl: 'https://github.com/test/repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'github',
            owner: 'test',
            repository: 'repo',
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'test_repo',
          name: 'repo',
          url: 'https://sonarqube.example.com/dashboard?id=test_repo',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      (client.createBoundProjectV2 as jest.Mock).mockResolvedValue(expectedResponse);

      builder
        .forPlatform(DevOpsPlatform.GITHUB)
        .withProjectIdentifier('test/repo')
        .withGitHubConfig({
          type: 'github',
          owner: 'test',
          repository: 'repo',
        });

      // Act
      const result = await builder.execute();

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(jest.mocked(client.createBoundProjectV2)).toHaveBeenCalled();
    });
  });
});
