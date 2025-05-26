import { http, HttpResponse } from 'msw';
import { ProjectsClient } from '../ProjectsClient';
import { server } from '../../../test-utils/msw/server';
import {
  assertCommonHeaders,
  assertRequestBody,
  assertQueryParams,
} from '../../../test-utils/assertions';
import type {
  CreateProjectResponse,
  Finding,
  GetContainsAiCodeResponse,
  LicenseUsageResponse,
} from '../types';

describe('ProjectsClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: ProjectsClient;

  beforeEach(() => {
    client = new ProjectsClient(baseUrl, token);
  });

  describe('bulkDelete', () => {
    it('should create a BulkDeleteProjectsBuilder', () => {
      const builder = client.bulkDelete();
      expect(builder).toBeDefined();
      expect(typeof builder.analyzedBefore).toBe('function');
      expect(typeof builder.onProvisionedOnly).toBe('function');
      expect(typeof builder.projects).toBe('function');
      expect(typeof builder.query).toBe('function');
      expect(typeof builder.qualifiers).toBe('function');
    });
  });

  describe('create', () => {
    it('should create a project', async () => {
      const mockResponse: CreateProjectResponse = {
        project: {
          key: 'my-project',
          name: 'My Project',
          qualifier: 'TRK',
          visibility: 'private',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/projects/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            project: 'my-project',
            name: 'My Project',
            visibility: 'private',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.create({
        project: 'my-project',
        name: 'My Project',
        visibility: 'private',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.delete({ project: 'my-project' })).resolves.toBeUndefined();
    });
  });

  describe('exportFindings', () => {
    it('should export findings for a project branch', async () => {
      const mockFindings: Finding[] = [
        {
          key: 'finding-1',
          type: 'BUG',
          severity: 'MAJOR',
          status: 'OPEN',
          component: 'src/main.ts',
          line: 42,
          message: 'Potential null reference',
          rule: 'typescript:S2259',
          creationDate: '2024-01-01T00:00:00Z',
        },
        {
          key: 'finding-2',
          type: 'CODE_SMELL',
          severity: 'MINOR',
          status: 'OPEN',
          component: 'src/utils.ts',
          line: 15,
          message: 'Function is too complex',
          rule: 'typescript:S3776',
          creationDate: '2024-01-02T00:00:00Z',
        },
      ];

      server.use(
        http.get(`${baseUrl}/api/projects/export_findings`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            project: 'my-project',
            branch: 'main',
          });
          return HttpResponse.json(mockFindings);
        })
      );

      const result = await client.exportFindings({
        project: 'my-project',
        branch: 'main',
      });

      expect(result).toEqual(mockFindings);
    });

    it('should export findings for a pull request', async () => {
      const mockFindings: Finding[] = [];

      server.use(
        http.get(`${baseUrl}/api/projects/export_findings`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            project: 'my-project',
            pullRequest: '123',
          });
          return HttpResponse.json(mockFindings);
        })
      );

      const result = await client.exportFindings({
        project: 'my-project',
        pullRequest: '123',
      });

      expect(result).toEqual(mockFindings);
    });

    it('should throw ValidationError when both branch and pullRequest are provided', async () => {
      await expect(
        client.exportFindings({
          project: 'test-project',
          branch: 'main',
          pullRequest: '123',
        })
      ).rejects.toThrow('Cannot specify both branch and pullRequest');
    });
  });

  describe('getContainsAiCode', () => {
    it('should get AI code status', async () => {
      const mockResponse: GetContainsAiCodeResponse = {
        containsAiCode: true,
      };

      server.use(
        http.get(`${baseUrl}/api/projects/get_contains_ai_code`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            project: 'my-project',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.getContainsAiCode({
        project: 'my-project',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('licenseUsage', () => {
    it('should get license usage information', async () => {
      const mockResponse: LicenseUsageResponse = {
        projects: [
          {
            key: 'project-1',
            name: 'Project 1',
            lastAnalysisDate: '2024-01-01T00:00:00Z',
            linesOfCode: 10000,
          },
          {
            key: 'project-2',
            name: 'Project 2',
            lastAnalysisDate: '2024-01-02T00:00:00Z',
            linesOfCode: 5000,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/projects/license_usage`, ({ request }) => {
          assertCommonHeaders(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.licenseUsage();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('search', () => {
    it('should create a SearchProjectsBuilder', () => {
      const builder = client.search();
      expect(builder).toBeDefined();
      expect(typeof builder.analyzedBefore).toBe('function');
      expect(typeof builder.onProvisionedOnly).toBe('function');
      expect(typeof builder.projects).toBe('function');
      expect(typeof builder.query).toBe('function');
      expect(typeof builder.qualifiers).toBe('function');
      expect(typeof builder.page).toBe('function');
      expect(typeof builder.pageSize).toBe('function');
      expect(typeof builder.all).toBe('function');
    });
  });

  describe('searchAll', () => {
    it('should return an async iterator', () => {
      const iterator = client.searchAll();
      expect(iterator).toBeDefined();
      expect(typeof iterator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('setContainsAiCode', () => {
    it('should set AI code status', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/set_contains_ai_code`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            project: 'my-project',
            containsAiCode: true,
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.setContainsAiCode({
          project: 'my-project',
          containsAiCode: true,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('updateKey', () => {
    it('should update project key', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/update_key`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            from: 'old-key',
            to: 'new-key',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.updateKey({
          from: 'old-key',
          to: 'new-key',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('updateVisibility', () => {
    it('should update project visibility', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/update_visibility`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            project: 'my-project',
            visibility: 'public',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.updateVisibility({
          project: 'my-project',
          visibility: 'public',
        })
      ).resolves.toBeUndefined();
    });
  });
});
