import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../test-utils/assertions';
import { SystemClient } from '../SystemClient';
import { AuthorizationError, AuthenticationError } from '../../../errors';
import type { HealthResponse, StatusResponse, InfoResponse } from '../types';
import type { SystemInfoV2, SystemHealthV2, SystemStatusV2Response } from '../types-v2';

describe('SystemClient', () => {
  let client: SystemClient;
  let clientWithEmptyToken: SystemClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new SystemClient(baseUrl, token);
    clientWithEmptyToken = new SystemClient(baseUrl, '');
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

      const result = await clientWithEmptyToken.status();
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

      const result = await clientWithEmptyToken.ping();
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

      await expect(clientWithEmptyToken.ping()).rejects.toThrow(AuthenticationError);
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

  describe('v2 API methods', () => {
    describe('getInfoV2', () => {
      it('should fetch system information v2', async () => {
        const mockResponse: SystemInfoV2 = {
          version: '10.8.0',
          edition: 'community',
          features: ['branch', 'audit'],
          serverId: '4622696D-AYuMnjWY_td5_ZrpCNOp',
          installedAt: '2023-01-15T10:30:00Z',
          database: {
            name: 'PostgreSQL',
            version: '13.7',
          },
          productionMode: true,
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/info`, ({ request }) => {
            assertAuthorizationHeader(request, token);
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getInfoV2();
        expect(result).toEqual(mockResponse);
        expect(result.edition).toBe('community');
        expect(result.features).toContain('branch');
      });

      it('should handle enterprise edition with additional features', async () => {
        const mockResponse: SystemInfoV2 = {
          version: '10.8.0',
          edition: 'enterprise',
          features: ['branch', 'audit', 'portfolios', 'governance', 'security'],
          serverId: '4622696D-AYuMnjWY_td5_ZrpCNOp',
          installedAt: '2023-01-15T10:30:00Z',
          database: {
            name: 'PostgreSQL',
            version: '14.5',
          },
          plugins: [
            { key: 'java', name: 'Java', version: '7.16.0.30901' },
            { key: 'javascript', name: 'JavaScript/TypeScript', version: '10.3.0.22755' },
          ],
          externalAuthProviders: ['ldap', 'saml'],
          productionMode: true,
          branchSupport: {
            enabled: true,
            includedLanguages: ['java', 'javascript', 'python'],
          },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/info`, () => {
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getInfoV2();
        expect(result.edition).toBe('enterprise');
        expect(result.features).toContain('portfolios');
        expect(result.plugins).toHaveLength(2);
        expect(result.externalAuthProviders).toContain('ldap');
        expect(result.branchSupport?.enabled).toBe(true);
      });

      it('should require authentication', async () => {
        server.use(
          http.get(`${baseUrl}/api/v2/system/info`, () => {
            return HttpResponse.json(
              {
                status: 403,
                error: {
                  message: 'Insufficient privileges',
                  code: 'FORBIDDEN',
                },
              },
              {
                status: 403,
                statusText: 'Forbidden',
              }
            );
          })
        );

        await expect(client.getInfoV2()).rejects.toThrow(AuthorizationError);
      });
    });

    describe('getHealthV2', () => {
      it('should fetch health status v2', async () => {
        const mockResponse: SystemHealthV2 = {
          status: 'GREEN',
          checkedAt: '2024-01-15T10:30:00Z',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/health`, ({ request }) => {
            assertAuthorizationHeader(request, token);
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getHealthV2();
        expect(result).toEqual(mockResponse);
        expect(result.status).toBe('GREEN');
      });

      it('should handle clustered setup with node health', async () => {
        const mockResponse: SystemHealthV2 = {
          status: 'YELLOW',
          nodes: [
            { name: 'node1', status: 'GREEN' },
            { name: 'node2', status: 'YELLOW', causes: ['High memory usage'] },
            { name: 'node3', status: 'GREEN' },
          ],
          checkedAt: '2024-01-15T10:30:00Z',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/health`, () => {
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getHealthV2();
        expect(result.status).toBe('YELLOW');
        expect(result.nodes).toHaveLength(3);
        expect(result.nodes?.[1].status).toBe('YELLOW');
        expect(result.nodes?.[1].causes).toContain('High memory usage');
      });

      it('should handle RED status with causes', async () => {
        const mockResponse: SystemHealthV2 = {
          status: 'RED',
          nodes: [{ name: 'node1', status: 'RED', causes: ['Database connection lost'] }],
          checkedAt: '2024-01-15T10:30:00Z',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/health`, () => {
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getHealthV2();
        expect(result.status).toBe('RED');
        expect(result.nodes?.[0].causes).toContain('Database connection lost');
      });
    });

    describe('getStatusV2', () => {
      it('should fetch system status v2', async () => {
        const mockResponse: SystemStatusV2Response = {
          status: 'UP',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/status`, ({ request }) => {
            assertAuthorizationHeader(request, token);
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getStatusV2();
        expect(result).toEqual(mockResponse);
        expect(result.status).toBe('UP');
      });

      it('should handle migration in progress', async () => {
        const mockResponse: SystemStatusV2Response = {
          status: 'DB_MIGRATION_RUNNING',
          message: 'Database migration in progress',
          migrationProgress: 67,
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/status`, () => {
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getStatusV2();
        expect(result.status).toBe('DB_MIGRATION_RUNNING');
        expect(result.migrationProgress).toBe(67);
        expect(result.message).toBe('Database migration in progress');
      });

      it('should handle starting status with startup time', async () => {
        const mockResponse: SystemStatusV2Response = {
          status: 'STARTING',
          message: 'System is starting up',
          startupTime: 45000,
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/status`, () => {
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.getStatusV2();
        expect(result.status).toBe('STARTING');
        expect(result.startupTime).toBe(45000);
      });

      it('should work without authentication', async () => {
        const mockResponse: SystemStatusV2Response = {
          status: 'UP',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/system/status`, ({ request }) => {
            assertNoAuthorizationHeader(request);
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await clientWithEmptyToken.getStatusV2();
        expect(result.status).toBe('UP');
      });
    });
  });
});
