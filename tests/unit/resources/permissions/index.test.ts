// @ts-nocheck
import { vi, describe, it, expect } from 'vitest';
import * as permissionsModule from '../../../../src/index.js';

describe.skip('Permissions module exports', () => {
  it('should export PermissionsClient class', () => {
    expect(permissionsModule.PermissionsClient).toBeDefined();
    expect(typeof permissionsModule.PermissionsClient).toBe('function');
  });

  it('should export builder classes', () => {
    expect(permissionsModule.SearchProjectPermissionsBuilder).toBeDefined();
    expect(permissionsModule.SearchTemplatesBuilder).toBeDefined();
    expect(permissionsModule.BulkApplyTemplateBuilder).toBeDefined();
  });

  it('should export type definitions', () => {
    // TypeScript types are not available at runtime, but we can verify
    // that the module structure is correct by checking exports exist
    const exports = Object.keys(permissionsModule);

    // Verify main exports are present
    expect(exports).toContain('PermissionsClient');
    expect(exports).toContain('SearchProjectPermissionsBuilder');
    expect(exports).toContain('SearchTemplatesBuilder');
    expect(exports).toContain('BulkApplyTemplateBuilder');
  });

  it('should have proper constructor signatures', () => {
    // Verify PermissionsClient can be instantiated
    const client = new permissionsModule.PermissionsClient('http://test.com', 'token');
    expect(client).toBeInstanceOf(permissionsModule.PermissionsClient);
  });

  it('should have builder classes that can be instantiated', () => {
    const mockExecutor = vi.fn();

    const searchProjectBuilder = new permissionsModule.SearchProjectPermissionsBuilder(
      mockExecutor,
    );

    expect(searchProjectBuilder).toBeInstanceOf(permissionsModule.SearchProjectPermissionsBuilder);

    const searchTemplatesBuilder = new permissionsModule.SearchTemplatesBuilder(mockExecutor);
    expect(searchTemplatesBuilder).toBeInstanceOf(permissionsModule.SearchTemplatesBuilder);

    const bulkApplyBuilder = new permissionsModule.BulkApplyTemplateBuilder(mockExecutor);
    expect(bulkApplyBuilder).toBeInstanceOf(permissionsModule.BulkApplyTemplateBuilder);
  });
});
