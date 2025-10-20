// @ts-nocheck
import {
  buildV2Query,
  parseV2Filter,
  buildV2Filters,
} from '../../../../src/core/utils/v2-query-builder.js';

describe('v2-query-builder', () => {
  describe('buildV2Query', () => {
    it('should handle simple parameters', () => {
      const query = buildV2Query({
        page: 2,
        pageSize: 50,
      });
      expect(query).toBe('page=2&pageSize=50');
    });

    it('should omit undefined and null values', () => {
      const query = buildV2Query({
        page: 1,
        pageSize: undefined,
        sort: null,
        order: 'asc',
      });
      expect(query).toBe('page=1&order=asc');
    });

    it('should handle arrays as comma-separated values', () => {
      const query = buildV2Query({
        userIds: ['uuid1', 'uuid2', 'uuid3'],
        permissions: ['admin', 'scan'],
      });
      expect(query).toBe('userIds=uuid1%2Cuuid2%2Cuuid3&permissions=admin%2Cscan');
    });

    it('should handle empty arrays', () => {
      const query = buildV2Query({
        page: 1,
        userIds: [],
      });
      expect(query).toBe('page=1');
    });

    it('should handle boolean values', () => {
      const query = buildV2Query({
        active: true,
        managed: false,
      });
      expect(query).toBe('active=true&managed=false');
    });

    it('should handle Date objects as ISO strings', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const query = buildV2Query({
        createdAfter: date,
      });
      expect(query).toBe('createdAfter=2024-01-15T10%3A30%3A00.000Z');
    });

    it('should handle mixed parameter types', () => {
      const query = buildV2Query({
        page: 1,
        active: true,
        userIds: ['uuid1', 'uuid2'],
        createdAfter: new Date('2024-01-01T00:00:00.000Z'),
        query: 'test search',
      });
      expect(query).toContain('page=1');
      expect(query).toContain('active=true');
      expect(query).toContain('userIds=uuid1%2Cuuid2');
      expect(query).toContain('createdAfter=2024-01-01T00%3A00%3A00.000Z');
      expect(query).toContain('query=test+search');
    });

    it('should handle special characters in values', () => {
      const query = buildV2Query({
        query: 'test & search',
        name: 'user@example.com',
      });
      expect(query).toBe('query=test+%26+search&name=user%40example.com');
    });

    it('should handle numeric values', () => {
      const query = buildV2Query({
        minMembers: 10,
        maxMembers: 100,
        threshold: 95.5,
      });
      expect(query).toBe('minMembers=10&maxMembers=100&threshold=95.5');
    });
  });

  describe('parseV2Filter', () => {
    it('should parse simple filter string', () => {
      const filter = parseV2Filter('status:eq:active');
      expect(filter).toEqual({
        field: 'status',
        operator: 'eq',
        value: 'active',
      });
    });

    it('should handle values with colons', () => {
      const filter = parseV2Filter('createdAt:gte:2024-01-01T10:30:00Z');
      expect(filter).toEqual({
        field: 'createdAt',
        operator: 'gte',
        value: '2024-01-01T10:30:00Z',
      });
    });

    it('should handle complex values', () => {
      const filter = parseV2Filter('url:contains:https://example.com:8080/path');
      expect(filter).toEqual({
        field: 'url',
        operator: 'contains',
        value: 'https://example.com:8080/path',
      });
    });

    it('should return null for invalid filter strings', () => {
      expect(parseV2Filter('invalid')).toBeNull();
      expect(parseV2Filter('field:operator')).toBeNull();
      expect(parseV2Filter('')).toBeNull();
    });
  });

  describe('buildV2Filters', () => {
    it('should build filter string from single filter', () => {
      const filterString = buildV2Filters([{ field: 'status', operator: 'eq', value: 'active' }]);
      expect(filterString).toBe('status:eq:active');
    });

    it('should build comma-separated filter string from multiple filters', () => {
      const filterString = buildV2Filters([
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'createdAt', operator: 'gte', value: '2024-01-01' },
        { field: 'role', operator: 'in', value: 'admin,user' },
      ]);
      expect(filterString).toBe('status:eq:active,createdAt:gte:2024-01-01,role:in:admin,user');
    });

    it('should handle numeric and boolean values', () => {
      const filterString = buildV2Filters([
        { field: 'count', operator: 'gt', value: 100 },
        { field: 'active', operator: 'eq', value: true },
      ]);
      expect(filterString).toBe('count:gt:100,active:eq:true');
    });

    it('should handle empty filters array', () => {
      const filterString = buildV2Filters([]);
      expect(filterString).toBe('');
    });
  });
});
