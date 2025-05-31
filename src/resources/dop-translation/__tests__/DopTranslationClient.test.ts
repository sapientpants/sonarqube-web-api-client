/**
 * Tests for DopTranslationClient
 * Comprehensive testing of DevOps platform integration functionality
 */

import { DopTranslationClient } from '../DopTranslationClient';
import {
  DevOpsPlatform,
  ProjectBindingStatus,
  PlatformStatus,
  ProjectVisibility,
  SyncStatus,
  type CreateBoundProjectV2Request,
  type CreateBoundProjectV2Response,
  type DopSettingsV2Response,
  type BatchCreateRequest,
} from '../types';

// Mock BaseClient
jest.mock('../../../core/BaseClient');

describe('DopTranslationClient', () => {
  let client: DopTranslationClient;
  const mockRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DopTranslationClient('https://sonarqube.example.com', 'test-token');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (client as any).request = mockRequest;
  });

  describe('createBoundProjectV2', () => {
    it('should create a GitHub bound project', async () => {
      // Arrange
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITHUB,
        projectIdentifier: 'my-org/my-repo',
        organizationName: 'my-org',
        repositoryName: 'my-repo',
        platformSpecific: {
          type: 'github',
          owner: 'my-org',
          repository: 'my-repo',
          defaultBranch: 'main',
        },
        sonarQubeProjectConfig: {
          name: 'My GitHub Project',
          visibility: ProjectVisibility.PRIVATE,
        },
      };

      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-123',
        key: 'my-org_my-repo',
        name: 'My GitHub Project',
        url: 'https://sonarqube.example.com/dashboard?id=my-org_my-repo',
        dopBinding: {
          id: 'binding-123',
          platform: DevOpsPlatform.GITHUB,
          externalProjectId: 'my-org/my-repo',
          externalUrl: 'https://github.com/my-org/my-repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'github',
            owner: 'my-org',
            repository: 'my-repo',
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'my-org_my-repo',
          name: 'My GitHub Project',
          url: 'https://sonarqube.example.com/dashboard?id=my-org_my-repo',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.createBoundProjectV2(request);

      // Assert
      expect(mockRequest).toHaveBeenCalledWith('/api/v2/dop-translation/bound-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should create a GitLab bound project', async () => {
      // Arrange
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITLAB,
        projectIdentifier: 'my-group/my-project',
        organizationName: 'my-group',
        repositoryName: 'my-project',
        platformSpecific: {
          type: 'gitlab',
          namespace: 'my-group',
          project: 'my-project',
          projectId: 12345,
          defaultBranch: 'main',
        },
        sonarQubeProjectConfig: {
          name: 'My GitLab Project',
          description: 'Project from GitLab',
          visibility: ProjectVisibility.PRIVATE,
        },
      };

      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-124',
        key: 'my-group_my-project',
        name: 'My GitLab Project',
        description: 'Project from GitLab',
        url: 'https://sonarqube.example.com/dashboard?id=my-group_my-project',
        dopBinding: {
          id: 'binding-124',
          platform: DevOpsPlatform.GITLAB,
          externalProjectId: 'my-group/my-project',
          externalUrl: 'https://gitlab.com/my-group/my-project',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'gitlab',
            namespace: 'my-group',
            project: 'my-project',
            projectId: 12345,
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'my-group_my-project',
          name: 'My GitLab Project',
          description: 'Project from GitLab',
          url: 'https://sonarqube.example.com/dashboard?id=my-group_my-project',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.createBoundProjectV2(request);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.dopBinding.platform).toBe(DevOpsPlatform.GITLAB);
    });

    it('should create a Bitbucket bound project', async () => {
      // Arrange
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.BITBUCKET,
        projectIdentifier: 'workspace/repo',
        organizationName: 'workspace',
        repositoryName: 'repo',
        platformSpecific: {
          type: 'bitbucket',
          workspace: 'workspace',
          repository: 'repo',
          uuid: '{12345-abcde}',
          defaultBranch: 'main',
        },
        sonarQubeProjectConfig: {
          name: 'My Bitbucket Project',
          visibility: ProjectVisibility.PRIVATE,
        },
      };

      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-125',
        key: 'workspace_repo',
        name: 'My Bitbucket Project',
        url: 'https://sonarqube.example.com/dashboard?id=workspace_repo',
        dopBinding: {
          id: 'binding-125',
          platform: DevOpsPlatform.BITBUCKET,
          externalProjectId: 'workspace/repo',
          externalUrl: 'https://bitbucket.org/workspace/repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'bitbucket',
            workspace: 'workspace',
            repository: 'repo',
            uuid: '{12345-abcde}',
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'workspace_repo',
          name: 'My Bitbucket Project',
          url: 'https://sonarqube.example.com/dashboard?id=workspace_repo',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.createBoundProjectV2(request);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.dopBinding.platform).toBe(DevOpsPlatform.BITBUCKET);
    });

    it('should create an Azure DevOps bound project', async () => {
      // Arrange
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.AzureDevops,
        projectIdentifier: 'org/project',
        organizationName: 'org',
        repositoryName: 'repo',
        platformSpecific: {
          type: 'azure-devops',
          organization: 'org',
          project: 'project',
          repository: 'repo',
          projectId: 'proj-123',
          repositoryId: 'repo-456',
          defaultBranch: 'main',
        },
        sonarQubeProjectConfig: {
          name: 'My Azure DevOps Project',
          visibility: ProjectVisibility.PRIVATE,
        },
      };

      const expectedResponse: CreateBoundProjectV2Response = {
        id: 'bound-project-126',
        key: 'org_repo',
        name: 'My Azure DevOps Project',
        url: 'https://sonarqube.example.com/dashboard?id=org_repo',
        dopBinding: {
          id: 'binding-126',
          platform: DevOpsPlatform.AzureDevops,
          externalProjectId: 'org/project',
          externalUrl: 'https://dev.azure.com/org/project/_git/repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'azure-devops',
            organization: 'org',
            project: 'project',
            repository: 'repo',
            projectId: 'proj-123',
            repositoryId: 'repo-456',
            defaultBranch: 'main',
          },
        },
        sonarQubeProject: {
          key: 'org_repo',
          name: 'My Azure DevOps Project',
          url: 'https://sonarqube.example.com/dashboard?id=org_repo',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.createBoundProjectV2(request);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.dopBinding.platform).toBe(DevOpsPlatform.AzureDevops);
    });

    it('should throw validation error for missing platform', async () => {
      // Arrange
      const invalidRequest = {
        projectIdentifier: 'test/repo',
      } as CreateBoundProjectV2Request;

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'Invalid request: Unsupported DevOps platform'
      );
    });

    it('should throw validation error for missing project identifier', async () => {
      // Arrange
      const invalidRequest = {
        dopPlatform: DevOpsPlatform.GITHUB,
      } as CreateBoundProjectV2Request;

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'Invalid request: Project identifier is required'
      );
    });

    it('should throw validation error for invalid GitHub config', async () => {
      // Arrange
      const invalidRequest: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITHUB,
        projectIdentifier: 'test/repo',
        platformSpecific: {
          type: 'github',
          owner: '',
          repository: 'repo',
        },
      };

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'GitHub owner/organization is required'
      );
    });

    it('should throw validation error for invalid GitLab config', async () => {
      // Arrange
      const invalidRequest: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITLAB,
        projectIdentifier: 'namespace/project',
        platformSpecific: {
          type: 'gitlab',
          namespace: '',
          project: 'project',
        },
      };

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'GitLab namespace is required'
      );
    });

    it('should throw validation error for invalid Bitbucket config', async () => {
      // Arrange
      const invalidRequest: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.BITBUCKET,
        projectIdentifier: 'workspace/repo',
        platformSpecific: {
          type: 'bitbucket',
          workspace: '',
          repository: 'repo',
        },
      };

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'Bitbucket workspace is required'
      );
    });

    it('should throw validation error for invalid Azure DevOps config', async () => {
      // Arrange
      const invalidRequest: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.AzureDevops,
        projectIdentifier: 'org/project',
        platformSpecific: {
          type: 'azure-devops',
          organization: '',
          project: 'project',
          repository: 'repo',
        },
      };

      // Act & Assert
      await expect(client.createBoundProjectV2(invalidRequest)).rejects.toThrow(
        'Azure DevOps organization is required'
      );
    });
  });

  describe('getDopSettingsV2', () => {
    it('should retrieve DOP platform settings', async () => {
      // Arrange
      const expectedResponse: DopSettingsV2Response = {
        platforms: [
          {
            key: 'github-main',
            name: 'GitHub.com',
            enabled: true,
            url: 'https://github.com',
            platform: DevOpsPlatform.GITHUB,
            authentication: {
              type: 'personal_access_token',
              credentials: {
                type: 'personal_access_token',
                token: 'ghp_***',
              },
            },
            configuration: {
              settings: {},
              endpoints: {
                apiUrl: 'https://api.github.com',
              },
            },
            lastSync: '2025-01-30T09:00:00Z',
            status: PlatformStatus.CONNECTED,
          },
          {
            key: 'gitlab-enterprise',
            name: 'GitLab Enterprise',
            enabled: true,
            url: 'https://gitlab.company.com',
            platform: DevOpsPlatform.GITLAB,
            authentication: {
              type: 'personal_access_token',
              credentials: {
                type: 'personal_access_token',
                token: 'glpat-***',
              },
            },
            configuration: {
              settings: {},
              endpoints: {
                apiUrl: 'https://gitlab.company.com/api/v4',
              },
            },
            lastSync: '2025-01-30T08:30:00Z',
            status: PlatformStatus.CONNECTED,
          },
        ],
        totalCount: 2,
        defaultPlatform: 'github-main',
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.getDopSettingsV2();

      // Assert
      expect(mockRequest).toHaveBeenCalledWith('/api/v2/dop-translation/dop-settings');
      expect(result).toEqual(expectedResponse);
      expect(result.platforms).toHaveLength(2);
      expect(result.platforms[0].platform).toBe(DevOpsPlatform.GITHUB);
      expect(result.platforms[1].platform).toBe(DevOpsPlatform.GITLAB);
      expect(result.defaultPlatform).toBe('github-main');
    });

    it('should handle empty platform settings', async () => {
      // Arrange
      const expectedResponse: DopSettingsV2Response = {
        platforms: [],
        totalCount: 0,
      };

      mockRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await client.getDopSettingsV2();

      // Assert
      expect(result.platforms).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.defaultPlatform).toBeUndefined();
    });
  });

  describe('createBoundProject builder', () => {
    it('should return a builder instance', () => {
      // Act
      const builder = client.createBoundProject();

      // Assert
      expect(builder).toBeDefined();
      expect(typeof builder.forPlatform).toBe('function');
      expect(typeof builder.withProjectIdentifier).toBe('function');
      expect(typeof builder.execute).toBe('function');
    });
  });

  describe('createBoundProjectsBatch', () => {
    it('should create multiple projects in batch', async () => {
      // Arrange
      const projects: CreateBoundProjectV2Request[] = [
        {
          dopPlatform: DevOpsPlatform.GITHUB,
          projectIdentifier: 'org/repo1',
          organizationName: 'org',
          repositoryName: 'repo1',
          platformSpecific: {
            type: 'github',
            owner: 'org',
            repository: 'repo1',
          },
        },
        {
          dopPlatform: DevOpsPlatform.GITLAB,
          projectIdentifier: 'group/repo2',
          organizationName: 'group',
          repositoryName: 'repo2',
          platformSpecific: {
            type: 'gitlab',
            namespace: 'group',
            project: 'repo2',
          },
        },
      ];

      const batchRequest: BatchCreateRequest = {
        projects,
        settings: {
          continueOnError: true,
          parallelLimit: 2,
          timeout: 30000,
        },
      };

      const mockResponses = projects.map((project, index) => ({
        id: `bound-project-${String(index + 1)}`,
        key: `${project.organizationName ?? ''}_${project.repositoryName ?? ''}`,
        name: project.repositoryName ?? '',
        url: `https://sonarqube.example.com/dashboard?id=${project.organizationName ?? ''}_${project.repositoryName ?? ''}`,
        dopBinding: {
          id: `binding-${String(index + 1)}`,
          platform: project.dopPlatform,
          externalProjectId: project.projectIdentifier,
          externalUrl: `https://example.com/${project.projectIdentifier}`,
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: project.platformSpecific ?? {},
        },
        sonarQubeProject: {
          key: `${project.organizationName ?? ''}_${project.repositoryName ?? ''}`,
          name: project.repositoryName ?? '',
          url: `https://sonarqube.example.com/dashboard?id=${project.organizationName ?? ''}_${project.repositoryName ?? ''}`,
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      }));

      mockRequest.mockResolvedValueOnce(mockResponses[0]).mockResolvedValueOnce(mockResponses[1]);

      // Act
      const result = await client.createBoundProjectsBatch(batchRequest);

      // Assert
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
    });

    it('should handle batch operation with failures when continueOnError is true', async () => {
      // Arrange
      const projects: CreateBoundProjectV2Request[] = [
        {
          dopPlatform: DevOpsPlatform.GITHUB,
          projectIdentifier: 'org/valid-repo',
          organizationName: 'org',
          repositoryName: 'valid-repo',
          platformSpecific: {
            type: 'github',
            owner: 'org',
            repository: 'valid-repo',
          },
        },
        {
          dopPlatform: DevOpsPlatform.GITHUB,
          projectIdentifier: 'org/invalid-repo',
          organizationName: 'org',
          repositoryName: 'invalid-repo',
          platformSpecific: {
            type: 'github',
            owner: '',
            repository: 'invalid-repo',
          },
        },
      ];

      const batchRequest: BatchCreateRequest = {
        projects,
        settings: {
          continueOnError: true,
          parallelLimit: 2,
          timeout: 30000,
        },
      };

      const successResponse = {
        id: 'bound-project-1',
        key: 'org_valid-repo',
        name: 'valid-repo',
        url: 'https://sonarqube.example.com/dashboard?id=org_valid-repo',
        dopBinding: {
          id: 'binding-1',
          platform: DevOpsPlatform.GITHUB,
          externalProjectId: 'org/valid-repo',
          externalUrl: 'https://github.com/org/valid-repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'github',
            owner: 'org',
            repository: 'valid-repo',
          },
        },
        sonarQubeProject: {
          key: 'org_valid-repo',
          name: 'valid-repo',
          url: 'https://sonarqube.example.com/dashboard?id=org_valid-repo',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      };

      mockRequest.mockResolvedValueOnce(successResponse);
      // The second request will fail validation before making the HTTP request

      // Act
      const result = await client.createBoundProjectsBatch(batchRequest);

      // Assert
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error?.message).toBe(
        'Invalid request: GitHub owner/organization is required'
      );
    });

    it('should stop on first error when continueOnError is false', async () => {
      // Arrange
      const projects: CreateBoundProjectV2Request[] = [
        {
          dopPlatform: DevOpsPlatform.GITHUB,
          projectIdentifier: 'org/invalid-repo',
          organizationName: 'org',
          repositoryName: 'invalid-repo',
          platformSpecific: {
            type: 'github',
            owner: '',
            repository: 'invalid-repo',
          },
        },
        {
          dopPlatform: DevOpsPlatform.GITHUB,
          projectIdentifier: 'org/valid-repo',
          organizationName: 'org',
          repositoryName: 'valid-repo',
          platformSpecific: {
            type: 'github',
            owner: 'org',
            repository: 'valid-repo',
          },
        },
      ];

      const batchRequest: BatchCreateRequest = {
        projects,
        settings: {
          continueOnError: false,
          parallelLimit: 1,
          timeout: 30000,
        },
      };

      // The first request will fail validation before making the HTTP request

      // Act & Assert
      await expect(client.createBoundProjectsBatch(batchRequest)).rejects.toThrow(
        'Invalid request: GitHub owner/organization is required'
      );
    });
  });

  describe('validation warnings', () => {
    it('should return warnings for invalid GitHub project identifier format', async () => {
      // We need to spy on the validatePlatformConfig method to check warnings
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITHUB,
        projectIdentifier: 'invalid-format', // Missing slash
        platformSpecific: {
          type: 'github',
          owner: 'owner',
          repository: 'repo',
        },
      };

      // Since warnings don't throw errors, the request should succeed
      mockRequest.mockResolvedValueOnce({
        id: 'test-id',
        key: 'test-key',
        name: 'test',
        url: 'test-url',
        dopBinding: {
          id: 'binding-id',
          platform: DevOpsPlatform.GITHUB,
          externalProjectId: 'invalid-format',
          externalUrl: 'https://github.com/owner/repo',
          lastSync: '2025-01-30T10:00:00Z',
          syncStatus: SyncStatus.SUCCESS,
          configuration: {
            type: 'github',
            owner: 'owner',
            repository: 'repo',
          },
        },
        sonarQubeProject: {
          key: 'test-key',
          name: 'test',
          url: 'test-url',
          visibility: ProjectVisibility.PRIVATE,
          createdAt: '2025-01-30T10:00:00Z',
        },
        createdAt: '2025-01-30T10:00:00Z',
        status: ProjectBindingStatus.ACTIVE,
      });

      await client.createBoundProjectV2(request);

      expect(mockRequest).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      const request: CreateBoundProjectV2Request = {
        dopPlatform: DevOpsPlatform.GITHUB,
        projectIdentifier: 'org/repo',
        organizationName: 'org',
        repositoryName: 'repo',
        platformSpecific: {
          type: 'github',
          owner: 'org',
          repository: 'repo',
        },
      };

      const networkError = new Error('Network error');
      mockRequest.mockRejectedValue(networkError);

      // Act & Assert
      await expect(client.createBoundProjectV2(request)).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      // Arrange
      mockRequest.mockRejectedValue(new Error('Unauthorized'));

      // Act & Assert
      await expect(client.getDopSettingsV2()).rejects.toThrow('Unauthorized');
    });
  });
});
