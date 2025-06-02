import { http, HttpResponse } from 'msw';
import { ProjectPullRequestsClient } from '../ProjectPullRequestsClient';
import { server } from '../../../test-utils/msw/server';
import { AuthenticationError, AuthorizationError, NotFoundError } from '../../../errors';
import { createApiError } from '../../../test-utils/msw/factories';
import type { ListPullRequestsResponse, PullRequest } from '../types';

describe('ProjectPullRequestsClient', () => {
  let client: ProjectPullRequestsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ProjectPullRequestsClient(baseUrl, token);
  });

  describe('list', () => {
    const mockPullRequests: PullRequest[] = [
      {
        key: '1543',
        title: 'Fix critical bug in authentication',
        branch: 'feature/fix-auth-bug',
        base: 'main',
        status: {
          qualityGateStatus: 'OK',
          bugs: 0,
          vulnerabilities: 0,
          codeSmells: 2,
        },
        analysisDate: '2024-01-15T10:30:00+0000',
        target: 'main',
      },
      {
        key: '1544',
        title: 'Add new feature for user management',
        branch: 'feature/user-management',
        base: 'develop',
        status: {
          qualityGateStatus: 'ERROR',
          bugs: 3,
          vulnerabilities: 1,
          codeSmells: 15,
        },
        analysisDate: '2024-01-16T14:20:00+0000',
        target: 'develop',
      },
    ];

    it('should return list of pull requests', async () => {
      const response: ListPullRequestsResponse = {
        pullRequests: mockPullRequests,
      };

      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(request.headers.get('authorization')).toBe(`Bearer ${token}`);

          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list({ project: 'my-project' });
      expect(result).toEqual(response);
      expect(result.pullRequests).toHaveLength(2);
      expect(result.pullRequests[0].key).toBe('1543');
      expect(result.pullRequests[0].status.qualityGateStatus).toBe('OK');
    });

    it('should return empty list when no pull requests exist', async () => {
      const response: ListPullRequestsResponse = {
        pullRequests: [],
      };

      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list({ project: 'my-project' });
      expect(result.pullRequests).toEqual([]);
    });

    it('should handle pull requests with new v2 fields', async () => {
      const prWithV2Fields: PullRequest = {
        ...mockPullRequests[0],
        pullRequestUuidV1: 'uuid-1543-v1',
        pullRequestId: 'pr-1543',
      };

      const response: ListPullRequestsResponse = {
        pullRequests: [prWithV2Fields],
      };

      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list({ project: 'my-project' });
      expect(result.pullRequests[0].pullRequestUuidV1).toBe('uuid-1543-v1');
      expect(result.pullRequests[0].pullRequestId).toBe('pr-1543');
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json(createApiError(401, 'Invalid credentials'), {
            status: 401,
          });
        })
      );

      await expect(client.list({ project: 'my-project' })).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json(
            createApiError(403, 'Insufficient privileges to access project'),
            {
              status: 403,
            }
          );
        })
      );

      await expect(client.list({ project: 'my-project' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json(createApiError(404, 'Project not found'), {
            status: 404,
          });
        })
      );

      await expect(client.list({ project: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a pull request', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_pull_requests/delete`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            project: 'my-project',
            pullRequest: '1543',
          });
          expect(request.headers.get('authorization')).toBe(`Bearer ${token}`);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.delete({ project: 'my-project', pullRequest: '1543' })
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_pull_requests/delete`, () => {
          return HttpResponse.json(createApiError(401, 'Invalid credentials'), {
            status: 401,
          });
        })
      );

      await expect(client.delete({ project: 'my-project', pullRequest: '1543' })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_pull_requests/delete`, () => {
          return HttpResponse.json(
            createApiError(403, 'Administer permission required on project'),
            {
              status: 403,
            }
          );
        })
      );

      await expect(client.delete({ project: 'my-project', pullRequest: '1543' })).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should handle not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_pull_requests/delete`, () => {
          return HttpResponse.json(createApiError(404, 'Pull request not found'), {
            status: 404,
          });
        })
      );

      await expect(client.delete({ project: 'my-project', pullRequest: '9999' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in project names', async () => {
      const projectName = 'my-project/with:special@chars';

      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe(projectName);

          return HttpResponse.json({ pullRequests: [] });
        })
      );

      await client.list({ project: projectName });
    });

    it('should handle pull requests with minimal data', async () => {
      const minimalPr: PullRequest = {
        key: '1',
        title: 'Minimal PR',
        branch: 'feature/minimal',
        base: 'main',
        status: {},
      };

      server.use(
        http.get(`${baseUrl}/api/project_pull_requests/list`, () => {
          return HttpResponse.json({ pullRequests: [minimalPr] });
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list({ project: 'my-project' });
      expect(result.pullRequests[0]).toEqual(minimalPr);
      expect(result.pullRequests[0].status.qualityGateStatus).toBeUndefined();
      expect(result.pullRequests[0].analysisDate).toBeUndefined();
    });
  });
});
