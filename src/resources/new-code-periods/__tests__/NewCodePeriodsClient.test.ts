import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { NewCodePeriodsClient } from '../NewCodePeriodsClient';
import { NewCodePeriodType } from '../types';
import { AuthorizationError, NotFoundError, ApiError, NetworkError } from '../../../errors';

describe('NewCodePeriodsClient', () => {
  let client: NewCodePeriodsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new NewCodePeriodsClient(baseUrl, token);
  });

  describe('list', () => {
    it('should list new code periods for a project', async () => {
      const mockResponse = {
        newCodePeriods: [
          {
            projectKey: 'my-project',
            branchKey: 'main',
            newCodePeriod: {
              type: NewCodePeriodType.PREVIOUS_VERSION,
              inherited: false,
            },
          },
          {
            projectKey: 'my-project',
            branchKey: 'develop',
            newCodePeriod: {
              type: NewCodePeriodType.NUMBER_OF_DAYS,
              value: '30',
              inherited: true,
            },
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/new_code_periods/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.list({ project: 'my-project' });

      expect(result).toEqual(mockResponse);
      expect(result.newCodePeriods).toHaveLength(2);
      expect(result.newCodePeriods[0].newCodePeriod.type).toBe(NewCodePeriodType.PREVIOUS_VERSION);
      expect(result.newCodePeriods[1].newCodePeriod.value).toBe('30');
    });

    it('should list new code periods for a specific branch', async () => {
      const mockResponse = {
        newCodePeriods: [
          {
            projectKey: 'my-project',
            branchKey: 'feature-branch',
            newCodePeriod: {
              type: NewCodePeriodType.REFERENCE_BRANCH,
              value: 'main',
              inherited: false,
            },
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/new_code_periods/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(url.searchParams.get('branch')).toBe('feature-branch');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.list({
        project: 'my-project',
        branch: 'feature-branch',
      });

      expect(result).toEqual(mockResponse);
      expect(result.newCodePeriods[0].newCodePeriod.type).toBe(NewCodePeriodType.REFERENCE_BRANCH);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/new_code_periods/list`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.list({ project: 'my-project' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/new_code_periods/list`, () => {
          return new HttpResponse('Project not found', { status: 404 });
        })
      );

      await expect(client.list({ project: 'nonexistent' })).rejects.toThrow(NotFoundError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/new_code_periods/list`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.list({ project: 'my-project' })).rejects.toThrow(NetworkError);
    });
  });

  describe('set', () => {
    it('should set global default new code period', async () => {
      const mockResponse = {
        newCodePeriod: {
          type: NewCodePeriodType.PREVIOUS_VERSION,
          inherited: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/new_code_periods/set`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('type=PREVIOUS_VERSION');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.set({
        type: NewCodePeriodType.PREVIOUS_VERSION,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should set project new code period with days', async () => {
      const mockResponse = {
        newCodePeriod: {
          type: NewCodePeriodType.NUMBER_OF_DAYS,
          value: '30',
          inherited: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/new_code_periods/set`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('type')).toBe('NUMBER_OF_DAYS');
          expect(params.get('project')).toBe('my-project');
          expect(params.get('value')).toBe('30');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.set({
        project: 'my-project',
        type: NewCodePeriodType.NUMBER_OF_DAYS,
        value: '30',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should set branch new code period with reference branch', async () => {
      const mockResponse = {
        newCodePeriod: {
          type: NewCodePeriodType.REFERENCE_BRANCH,
          value: 'main',
          inherited: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/new_code_periods/set`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('type')).toBe('REFERENCE_BRANCH');
          expect(params.get('project')).toBe('my-project');
          expect(params.get('branch')).toBe('feature-branch');
          expect(params.get('value')).toBe('main');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.set({
        project: 'my-project',
        branch: 'feature-branch',
        type: NewCodePeriodType.REFERENCE_BRANCH,
        value: 'main',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle authorization errors when setting', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/set`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(
        client.set({
          type: NewCodePeriodType.PREVIOUS_VERSION,
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/set`, () => {
          return new HttpResponse('Invalid parameters', { status: 400 });
        })
      );

      await expect(
        client.set({
          type: NewCodePeriodType.NUMBER_OF_DAYS,
          value: 'invalid',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('unset', () => {
    it('should unset project new code period', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/unset`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('project')).toBe('my-project');
          expect(params.get('branch')).toBeNull();
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.unset({ project: 'my-project' })).resolves.toBeUndefined();
    });

    it('should unset branch new code period', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/unset`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('project')).toBe('my-project');
          expect(params.get('branch')).toBe('feature-branch');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.unset({
          project: 'my-project',
          branch: 'feature-branch',
        })
      ).resolves.toBeUndefined();
    });

    it('should handle authorization errors when unsetting', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/unset`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.unset({ project: 'my-project' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle not found errors when unsetting', async () => {
      server.use(
        http.post(`${baseUrl}/api/new_code_periods/unset`, () => {
          return new HttpResponse('Project not found', { status: 404 });
        })
      );

      await expect(client.unset({ project: 'nonexistent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new NewCodePeriodsClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(NewCodePeriodsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new NewCodePeriodsClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(NewCodePeriodsClient);
    });
  });
});
