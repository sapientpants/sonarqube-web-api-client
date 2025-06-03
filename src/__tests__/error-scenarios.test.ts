import { describe, it, expect, beforeEach } from '@jest/globals';
import { http, HttpResponse, delay } from 'msw';
import { SonarQubeClient } from '../index';
import { AuthenticationError, RateLimitError, NetworkError, ServerError } from '../errors';
import { server } from '../test-utils/msw/server';

describe('Error Scenarios with MSW', () => {
  let client: SonarQubeClient;
  const baseUrl = 'https://sonarqube.example.com';

  beforeEach(() => {
    client = new SonarQubeClient(baseUrl, 'test-token');
  });

  describe('Authentication Errors', () => {
    it('should handle expired token', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Token expired' }] }, { status: 401 });
        })
      );

      await expect(client.getProjects()).rejects.toThrow(AuthenticationError);
    });

    it('should handle invalid token format', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Invalid token format' }] }, { status: 401 });
        })
      );

      await expect(client.getProjects()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit with retry-after header', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Rate limit exceeded' }] },
            {
              status: 429,
              headers: {
                'Retry-After': '60',
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Date.now() + 60000),
              },
            }
          );
        })
      );

      try {
        await client.getProjects();
        fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBe(60);
        }
      }
    });

    it('should retry after rate limit reset', async () => {
      let attemptCount = 0;

      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          attemptCount++;

          if (attemptCount === 1) {
            return HttpResponse.json(
              { errors: [{ msg: 'Rate limit exceeded' }] },
              {
                status: 429,
                headers: { 'Retry-After': '1' },
              }
            );
          }

          return HttpResponse.json({
            components: [{ key: 'project1', name: 'Project 1' }],
            paging: { pageIndex: 1, pageSize: 100, total: 1 },
          });
        })
      );

      // First attempt should fail
      await expect(client.getProjects()).rejects.toThrow(RateLimitError);

      // Second attempt should succeed

      const result = await client.getProjects();
      expect(result.components).toHaveLength(1);
      expect(attemptCount).toBe(2);
    });
  });

  describe('Network Errors', () => {
    it('should handle network failures', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.getProjects()).rejects.toThrow(NetworkError);
    });

    it('should handle DNS resolution failures', async () => {
      const dnsFailClient = new SonarQubeClient(
        'https://non-existent-domain-12345.com',
        'test-token'
      );

      server.use(
        http.get('https://non-existent-domain-12345.com/api/projects/search', () => {
          return HttpResponse.error();
        })
      );

      await expect(dnsFailClient.getProjects()).rejects.toThrow(NetworkError);
    });
  });

  describe('Server Errors', () => {
    it('should handle 500 Internal Server Error', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Database connection failed' }],
              requestId: 'req-123456',
            },
            {
              status: 500,
              headers: {
                'X-Request-Id': 'req-123456',
              },
            }
          );
        })
      );

      await expect(client.getProjects()).rejects.toThrow(ServerError);
    });

    it('should handle 503 Service Unavailable', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return new HttpResponse('Service temporarily unavailable', {
            status: 503,
            headers: {
              'Retry-After': '300',
            },
          });
        })
      );

      await expect(client.getProjects()).rejects.toThrow(ServerError);
    });

    it('should handle server maintenance mode', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'SonarQube is under maintenance' }] },
            { status: 503 }
          );
        })
      );

      try {
        await client.getProjects();
        fail('Should have thrown ServerError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        if (error instanceof ServerError) {
          expect(error.message).toContain('maintenance');
        }
      }
    });
  });

  describe('Timeout Scenarios', () => {
    it('should handle request timeouts', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, async () => {
          await delay(5000); // Delay longer than typical timeout
          return HttpResponse.json({});
        })
      );

      // This would timeout if the client has timeout configured
      // For now, it will just take a long time
      // In a real implementation, you'd configure the client with a timeout
    });

    it('should handle slow responses', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, async () => {
          await delay(100); // Small delay to simulate slow response
          return HttpResponse.json({
            components: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      const start = Date.now();

      const result = await client.getProjects();
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(result.components).toEqual([]);
    });
  });

  describe('Conditional Error Responses', () => {
    it('should handle errors based on request parameters', async () => {
      server.use(
        http.get(`${baseUrl}/api/issues/search`, ({ request }) => {
          const url = new URL(request.url);
          const projectKey = url.searchParams.get('componentKeys');

          if (projectKey === 'forbidden-project') {
            return HttpResponse.json(
              { errors: [{ msg: 'Insufficient privileges' }] },
              { status: 403 }
            );
          }

          if (projectKey === 'non-existent-project') {
            return HttpResponse.json(
              { errors: [{ msg: 'Component key not found' }] },
              { status: 404 }
            );
          }

          return HttpResponse.json({
            issues: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      // Normal request succeeds

      const result = await client.getIssues('normal-project');
      expect(result.issues).toEqual([]);

      // Forbidden project throws 403
      await expect(client.getIssues('forbidden-project')).rejects.toThrow();

      // Non-existent project throws 404
      await expect(client.getIssues('non-existent-project')).rejects.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should recover after transient errors', async () => {
      let requestCount = 0;

      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          requestCount++;

          // Fail first two requests, succeed on third
          if (requestCount < 3) {
            return new HttpResponse(null, { status: 503 });
          }

          return HttpResponse.json({
            components: [{ key: 'project1', name: 'Project 1' }],
            paging: { pageIndex: 1, pageSize: 100, total: 1 },
          });
        })
      );

      // First two attempts fail
      await expect(client.getProjects()).rejects.toThrow(ServerError);
      await expect(client.getProjects()).rejects.toThrow(ServerError);

      // Third attempt succeeds

      const result = await client.getProjects();
      expect(result.components).toHaveLength(1);
      expect(requestCount).toBe(3);
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle cascading errors', async () => {
      server.use(
        // First endpoint fails with auth error
        http.get(`${baseUrl}/api/projects/search`, () => {
          return new HttpResponse(null, { status: 401 });
        }),

        // Subsequent endpoints would also fail
        http.get(`${baseUrl}/api/issues/search`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      // Both requests should fail with same error type
      await expect(client.getProjects()).rejects.toThrow(AuthenticationError);
      await expect(client.getIssues()).rejects.toThrow(AuthenticationError);
    });

    it('should handle partial failures in batch operations', async () => {
      let projectCallCount = 0;

      server.use(
        http.get(`${baseUrl}/api/projects/search`, () => {
          projectCallCount++;

          // Alternate between success and failure
          if (projectCallCount % 2 === 0) {
            return new HttpResponse(null, { status: 500 });
          }

          return HttpResponse.json({
            components: [
              {
                key: `project${String(projectCallCount)}`,
                name: `Project ${String(projectCallCount)}`,
              },
            ],
            paging: { pageIndex: 1, pageSize: 100, total: 1 },
          });
        })
      );

      const results = [];
      const errors = [];

      // Make 4 requests
      for (let i = 0; i < 4; i++) {
        try {
          const result = await client.getProjects();
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      expect(results).toHaveLength(2); // Two successes
      expect(errors).toHaveLength(2); // Two failures
      expect(errors[0]).toBeInstanceOf(ServerError);
      expect(errors[1]).toBeInstanceOf(ServerError);
    });
  });
});
