import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../test-utils/assertions';
import { SystemClient } from '../SystemClient';
import { AuthorizationError, AuthenticationError } from '../../../errors';
import type { HealthResponse, StatusResponse, InfoResponse } from '../types';

describe('SystemClient', () => {
  let client: SystemClient;
  let clientWithoutToken: SystemClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new SystemClient(baseUrl, token);
    clientWithoutToken = new SystemClient(baseUrl, '');
  });

  describe('health', () => {
    it('should fetch health status when system is healthy', async () => {
      const mockResponse: HealthResponse = {
        health: 'GREEN',
        causes: [],
      };

      server.use(
        http.get(`${baseUrl}/api/system/health`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.health();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch health status with causes when system has issues', async () => {
      const mockResponse: HealthResponse = {
        health: 'YELLOW',
        causes: ['Elasticsearch cluster is not healthy', 'Background task queue is too large'],
      };

      server.use(
        http.get(`${baseUrl}/api/system/health`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.health();
      expect(result.health).toBe('YELLOW');
      expect(result.causes).toHaveLength(2);
      expect(result.causes).toContain('Elasticsearch cluster is not healthy');
    });

    it('should handle RED health status', async () => {
      const mockResponse: HealthResponse = {
        health: 'RED',
        causes: ['Database connection lost'],
      };

      server.use(
        http.get(`${baseUrl}/api/system/health`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.health();
      expect(result.health).toBe('RED');
      expect(result.causes).toContain('Database connection lost');
    });

    it('should throw authorization error when lacking permissions', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/health`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Insufficient privileges' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            }
          );
        })
      );

      await expect(client.health()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('status', () => {
    it('should fetch system status when operational', async () => {
      const mockResponse: StatusResponse = {
        id: '4622696D-AYuMnjWY_td5_ZrpCNOp',
        version: '10.3.0.82913',
        status: 'UP',
      };

      server.use(
        http.get(`${baseUrl}/api/system/status`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.status();
      expect(result).toEqual(mockResponse);
    });

    it('should handle DOWN status', async () => {
      const mockResponse: StatusResponse = {
        id: 'ABCD1234',
        version: '10.3.0.82913',
        status: 'DOWN',
      };

      server.use(
        http.get(`${baseUrl}/api/system/status`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.status();
      expect(result.status).toBe('DOWN');
    });

    it('should handle STARTING status', async () => {
      const mockResponse: StatusResponse = {
        id: 'ABCD1234',
        version: '10.3.0.82913',
        status: 'STARTING',
      };

      server.use(
        http.get(`${baseUrl}/api/system/status`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.status();
      expect(result.status).toBe('STARTING');
    });

    it('should handle DB_MIGRATION_RUNNING status', async () => {
      const mockResponse: StatusResponse = {
        id: 'ABCD1234',
        version: '10.4.0.87286',
        status: 'DB_MIGRATION_RUNNING',
      };

      server.use(
        http.get(`${baseUrl}/api/system/status`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.status();
      expect(result.status).toBe('DB_MIGRATION_RUNNING');
    });

    it('should work without authentication token', async () => {
      const mockResponse: StatusResponse = {
        id: 'ABCD1234',
        version: '10.3.0.82913',
        status: 'UP',
      };

      server.use(
        http.get(`${baseUrl}/api/system/status`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await clientWithoutToken.status();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('ping', () => {
    it('should return pong response', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/ping`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return new HttpResponse('pong', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        })
      );

      const result = await client.ping();
      expect(result).toBe('pong');
    });

    it('should work without authentication for health checks', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/ping`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return new HttpResponse('pong', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        })
      );

      const result = await clientWithoutToken.ping();
      expect(result).toBe('pong');
    });

    it('should handle authentication requirement', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/ping`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Authentication required' }],
            },
            {
              status: 401,
              statusText: 'Unauthorized',
            }
          );
        })
      );

      await expect(clientWithoutToken.ping()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('info', () => {
    it('should fetch detailed system information', async () => {
      const mockResponse: InfoResponse = {
        'System Date': '2024-01-15T10:30:00+0000',
        Database: {
          Name: 'PostgreSQL',
          Version: '13.7',
        },
        'Compute Engine': {
          'Pending Tasks': 0,
          'In Progress Tasks': 2,
        },
        Elasticsearch: {
          State: 'GREEN',
          Indices: {
            components: {
              'Index Size': '456.7 MB',
              'Docs Count': 123456,
            },
            issues: {
              'Index Size': '1.2 GB',
              'Docs Count': 789012,
            },
          },
        },
        'JVM Properties': {
          'java.version': '17.0.5',
          'java.vendor': 'Eclipse Adoptium',
        },
      };

      server.use(
        http.get(`${baseUrl}/api/system/info`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.info();
      expect(result['System Date']).toBe('2024-01-15T10:30:00+0000');
      expect(result.Database).toEqual({
        Name: 'PostgreSQL',
        Version: '13.7',
      });
      expect(result.Elasticsearch).toBeDefined();
    });

    it('should handle minimal system information', async () => {
      const mockResponse: InfoResponse = {
        'System Date': '2024-01-15T10:30:00+0000',
      };

      server.use(
        http.get(`${baseUrl}/api/system/info`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.info();
      expect(result['System Date']).toBe('2024-01-15T10:30:00+0000');
      expect(result.Database).toBeUndefined();
    });

    it('should throw authorization error when lacking admin permissions', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/info`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Requires system administration permission' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            }
          );
        })
      );

      await expect(client.info()).rejects.toThrow(AuthorizationError);
    });

    it('should handle endpoint not available', async () => {
      server.use(
        http.get(`${baseUrl}/api/system/info`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Unknown URL' }],
            },
            {
              status: 404,
              statusText: 'Not Found',
            }
          );
        })
      );

      await expect(client.info()).rejects.toThrow();
    });
  });
});
