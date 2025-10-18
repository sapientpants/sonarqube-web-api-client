// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { SonarQubeClient } from '../../../src/index';
import { AuthenticationError } from '../../../src/errors';
import { server } from '../../../src/test-utils/msw/server';
import {
  createProjectsResponse,
  createIssuesResponse,
} from '../../../src/test-utils/msw/factories';
import {
  assertAuthorizationHeader,
  assertContentTypeHeader,
} from '../../../src/test-utils/assertions';

describe('SonarQubeClient', () => {
  describe('constructor', () => {
    it('should create instance with base URL and token', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');
      expect(client).toBeInstanceOf(SonarQubeClient);
    });

    it('should remove trailing slash from base URL', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com/', 'test-token');
      expect(client['baseUrl']).toBe('https://sonarqube.example.com');
    });

    it('should accept organization parameter', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token', 'my-org');
      expect(client['authProvider']).toBeDefined();
      expect(client['authProvider'].getAuthType()).toBe('bearer');
      expect(client['options'].organization).toBe('my-org');
    });

    it('should handle undefined organization parameter', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');
      expect(client['authProvider']).toBeDefined();
      expect(client['authProvider'].getAuthType()).toBe('bearer');
      expect(client['options'].organization).toBeUndefined();
    });

    it('should pass organization parameter to all resource clients', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token', 'my-org');

      // Verify organization is passed to resource clients
      expect(client.projects['organization']).toBe('my-org');
      expect(client.issues['organization']).toBe('my-org');
      expect(client.measures['organization']).toBe('my-org');
      expect(client.metrics['organization']).toBe('my-org');
      expect(client.qualityGates['organization']).toBe('my-org');
      expect(client.sources['organization']).toBe('my-org');
      expect(client.system['organization']).toBe('my-org');
      expect(client.almIntegrations['organization']).toBe('my-org');
      expect(client.almSettings['organization']).toBe('my-org');
      expect(client.analysisCache['organization']).toBe('my-org');
      expect(client.applications['organization']).toBe('my-org');
    });

    it('should pass undefined organization to resource clients when not provided', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      // Verify organization is undefined in resource clients
      expect(client.projects['organization']).toBeUndefined();
      expect(client.issues['organization']).toBeUndefined();
      expect(client.measures['organization']).toBeUndefined();
      expect(client.metrics['organization']).toBeUndefined();
      expect(client.qualityGates['organization']).toBeUndefined();
      expect(client.sources['organization']).toBeUndefined();
      expect(client.system['organization']).toBeUndefined();
    });
  });

  describe('getProjects', () => {
    it('should fetch projects', async () => {
      const mockResponse = createProjectsResponse([]);

      server.use(
        http.get('https://sonarqube.example.com/api/projects/search', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      const result = await client.getProjects();

      expect(result).toEqual(mockResponse);
    });

    it('should include organization parameter in projects request', async () => {
      const mockResponse = createProjectsResponse([]);
      let capturedUrl: string | null = null;

      server.use(
        http.get('https://sonarqube.example.com/api/projects/search', ({ request }) => {
          capturedUrl = request.url;
          assertAuthorizationHeader(request, 'test-token');
          assertContentTypeHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token', 'my-org');

      const result = await client.getProjects();

      expect(capturedUrl).toContain('organization=my-org');
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token when provided', async () => {
      const mockResponse = createProjectsResponse([]);

      server.use(
        http.get('https://sonarqube.example.com/api/projects/search', ({ request }) => {
          assertAuthorizationHeader(request, 'test-token');
          assertContentTypeHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      const result = await client.getProjects();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getIssues', () => {
    it('should fetch issues without project key', async () => {
      const mockResponse = createIssuesResponse([]);

      server.use(
        http.get('https://sonarqube.example.com/api/issues/search', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      const result = await client.getIssues();

      expect(result).toEqual(mockResponse);
    });

    it('should fetch issues with project key', async () => {
      const mockResponse = createIssuesResponse([]);
      let capturedUrl: string | null = null;

      server.use(
        http.get('https://sonarqube.example.com/api/issues/search', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      const result = await client.getIssues('my-project');

      expect(capturedUrl).toContain('componentKeys=my-project');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      server.use(
        http.get('https://sonarqube.example.com/api/issues/search', () => {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized',
          });
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');

      await expect(client.getIssues()).rejects.toThrow(AuthenticationError);
    });

    it('should include organization parameter in issues request', async () => {
      const mockResponse = createIssuesResponse([]);
      let capturedUrl: string | null = null;

      server.use(
        http.get('https://sonarqube.example.com/api/issues/search', ({ request }) => {
          capturedUrl = request.url;
          assertAuthorizationHeader(request, 'test-token');
          assertContentTypeHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token', 'my-org');

      const result = await client.getIssues('my-project');

      expect(capturedUrl).toContain('organization=my-org');
      expect(capturedUrl).toContain('componentKeys=my-project');
      expect(result).toEqual(mockResponse);
    });
  });
});
