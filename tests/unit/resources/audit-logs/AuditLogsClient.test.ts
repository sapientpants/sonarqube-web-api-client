// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import { AuditLogsClient } from '../../../../src/resources/audit-logs/AuditLogsClient';
import type {
  SearchAuditLogsResponse,
  AuditLogEntry,
} from '../../../../src/resources/audit-logs/types';
import { AuthorizationError, ApiError, NetworkError } from '../../../../src/errors';

describe('AuditLogsClient', () => {
  let client: AuditLogsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AuditLogsClient(baseUrl, token);
  });

  describe('search', () => {
    it('should search audit logs with no parameters', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [
          {
            id: '1',
            timestamp: '2024-01-15T10:30:00Z',
            userLogin: 'john.doe',
            userName: 'John Doe',
            category: 'AUTH',
            action: 'LOGIN',
            ipAddress: '192.168.1.100',
          },
          {
            id: '2',
            timestamp: '2024-01-15T11:45:00Z',
            userLogin: 'jane.smith',
            userName: 'Jane Smith',
            category: 'PROJECT',
            action: 'CREATE',
            resource: 'my-project',
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 2,
          totalPages: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.toString()).toBe('');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.search();

      expect(result).toEqual(mockResponse);
      expect(result.auditLogs).toHaveLength(2);
      expect(result.auditLogs[0].action).toBe('LOGIN');
    });

    it('should search audit logs with category filter', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [
          {
            id: '1',
            timestamp: '2024-01-15T10:30:00Z',
            userLogin: 'john.doe',
            userName: 'John Doe',
            category: 'AUTH',
            action: 'LOGIN',
            ipAddress: '192.168.1.100',
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('category')).toBe('AUTH');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.search({ category: 'AUTH' });

      expect(result.auditLogs[0].category).toBe('AUTH');
    });

    it('should search audit logs with all parameters', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [],
        page: {
          pageIndex: 2,
          pageSize: 10,
          totalItems: 15,
          totalPages: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('category')).toBe('AUTH');
          expect(url.searchParams.get('action')).toBe('LOGIN');
          expect(url.searchParams.get('userLogin')).toBe('john.doe');
          expect(url.searchParams.get('from')).toBe('2024-01-01T00:00:00Z');
          expect(url.searchParams.get('to')).toBe('2024-01-31T23:59:59Z');
          expect(url.searchParams.get('page')).toBe('2');
          expect(url.searchParams.get('pageSize')).toBe('10');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.search({
        category: 'AUTH',
        action: 'LOGIN',
        userLogin: 'john.doe',
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
        page: 2,
        pageSize: 10,
      });

      expect(result.page.pageIndex).toBe(2);
      expect(result.page.pageSize).toBe(10);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.search()).rejects.toThrow(AuthorizationError);
    });

    it('should handle API error for Community Edition', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return new HttpResponse('Audit logs not available in Community Edition', { status: 400 });
        }),
      );

      await expect(client.search()).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.search()).rejects.toThrow(NetworkError);
    });
  });

  describe('searchAll', () => {
    it('should iterate through all audit logs with pagination', async () => {
      const mockResponse1: SearchAuditLogsResponse = {
        auditLogs: [
          {
            id: '1',
            timestamp: '2024-01-15T10:30:00Z',
            userLogin: 'user1',
            userName: 'User 1',
            category: 'AUTH',
            action: 'LOGIN',
          },
        ],
        page: { pageIndex: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      const mockResponse2: SearchAuditLogsResponse = {
        auditLogs: [
          {
            id: '2',
            timestamp: '2024-01-15T11:30:00Z',
            userLogin: 'user2',
            userName: 'User 2',
            category: 'AUTH',
            action: 'LOGOUT',
          },
        ],
        page: { pageIndex: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('page') ?? '1';
          const pageSize = url.searchParams.get('pageSize');
          expect(pageSize).toBe('500'); // Should use maximum page size

          if (page === '1') {
            return HttpResponse.json(mockResponse1);
          } else {
            return HttpResponse.json(mockResponse2);
          }
        }),
      );

      const auditLogs: AuditLogEntry[] = [];
      for await (const auditLog of client.searchAll()) {
        auditLogs.push(auditLog);
      }

      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].userLogin).toBe('user1');
      expect(auditLogs[1].userLogin).toBe('user2');
    });

    it('should handle empty results', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [],
        page: { pageIndex: 1, pageSize: 500, totalItems: 0, totalPages: 0 },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const auditLogs: AuditLogEntry[] = [];
      for await (const auditLog of client.searchAll()) {
        auditLogs.push(auditLog);
      }

      expect(auditLogs).toHaveLength(0);
    });

    it('should pass filter parameters to search', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [],
        page: { pageIndex: 1, pageSize: 500, totalItems: 0, totalPages: 0 },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('category')).toBe('AUTH');
          expect(url.searchParams.get('userLogin')).toBe('john.doe');
          return HttpResponse.json(mockResponse);
        }),
      );

      const auditLogs: AuditLogEntry[] = [];
      for await (const auditLog of client.searchAll({
        category: 'AUTH',
        userLogin: 'john.doe',
      })) {
        auditLogs.push(auditLog);
      }

      expect(auditLogs).toHaveLength(0);
    });
  });

  describe('download', () => {
    it('should download audit logs with no parameters', async () => {
      const mockBlob = new Blob(['audit,log,data'], { type: 'text/csv' });

      server.use(
        http.get(`${baseUrl}/api/audit_logs/download`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.toString()).toBe('');
          return new HttpResponse(mockBlob, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="audit-logs.csv"',
            },
          });
        }),
      );

      const result = await client.download();

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
    });

    it('should download audit logs with all parameters', async () => {
      const mockBlob = new Blob(['{"auditLogs":[]}'], { type: 'application/json' });

      server.use(
        http.get(`${baseUrl}/api/audit_logs/download`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('from')).toBe('2024-01-01T00:00:00Z');
          expect(url.searchParams.get('to')).toBe('2024-01-31T23:59:59Z');
          expect(url.searchParams.get('format')).toBe('json');
          return new HttpResponse(mockBlob, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="audit-logs.json"',
            },
          });
        }),
      );

      const result = await client.download({
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
        format: 'json',
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/json');
    });

    it('should handle authorization errors when downloading', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/download`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.download()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('isAvailable', () => {
    it('should return true when audit logs are available', async () => {
      const mockResponse: SearchAuditLogsResponse = {
        auditLogs: [],
        page: { pageIndex: 1, pageSize: 1, totalItems: 0, totalPages: 0 },
      };

      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('pageSize')).toBe('1');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when audit logs are not available', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return new HttpResponse('Not Found', { status: 404 });
        }),
      );

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false on Community Edition', async () => {
      server.use(
        http.get(`${baseUrl}/api/audit_logs/search`, () => {
          return new HttpResponse('Audit logs not available', { status: 400 });
        }),
      );

      const result = await client.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new AuditLogsClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(AuditLogsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new AuditLogsClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(AuditLogsClient);
    });
  });
});
