import {
  Deprecated,
  DeprecatedClass,
  DeprecatedParameter,
  DeprecationRegistry,
  CompatibilityBridge,
  MigrationAssistant,
  withCompatibility,
} from '../index';

describe('Enhanced Deprecation System', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Enhanced Decorators', () => {
    it('should register metadata and emit warnings with @Deprecated', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
          reason: 'Performance improvements in new method',
          examples: [
            {
              before: 'obj.oldMethod()',
              after: 'obj.newMethod()',
              description: 'Simple replacement',
            },
          ],
        })
        oldMethod(): string {
          return 'old';
        }

        newMethod(): string {
          return 'new';
        }
      }

      const instance = new TestClass();
      instance.oldMethod();

      // Check warning was emitted
      expect(consoleSpy).toHaveBeenCalled();
      const warning = consoleSpy.mock.calls[0][0];
      expect(warning).toContain('DEPRECATED');
      expect(warning).toContain('oldMethod');

      // Check example was shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Migration Example'));

      // Check metadata was registered
      const metadata = DeprecationRegistry.get('TestClass.oldMethod()');
      expect(metadata).toBeDefined();
      expect(metadata?.replacement).toBe('newMethod()');
    });

    it('should emit critical error for past removal date', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2020-01-01', // Past date
          reason: 'Should have been removed',
        })
        veryOldMethod(): void {
          // Method implementation
        }
      }

      const instance = new TestClass();
      instance.veryOldMethod();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'));
    });

    it('should handle class deprecation', () => {
      @DeprecatedClass({
        deprecatedSince: '2.0.0',
        removalDate: '2025-12-31',
        replacement: 'NewClass',
        reason: 'Entire class has been redesigned',
      })
      class OldClass {
        method(): string {
          return 'old';
        }
      }

      new OldClass();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OldClass'));
    });

    it('should handle parameter deprecation', () => {
      class TestClass {
        @DeprecatedParameter(1, 'oldParam', {
          reason: 'This parameter is no longer needed',
          replacement: 'Use options object instead',
        })
        method(value: string, oldParam?: boolean): string {
          return oldParam ? value.toUpperCase() : value;
        }
      }

      const instance = new TestClass();

      // Call without deprecated parameter - no warning
      consoleSpy.mockClear();
      instance.method('test');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Call with deprecated parameter - should warn
      instance.method('test', true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Parameter 'oldParam' in TestClass.method() is deprecated")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Use options object instead')
      );
    });
  });

  describe('Compatibility Bridge', () => {
    it('should translate old API calls to new ones', () => {
      class ApiClient {
        users = {
          search(params: { ps?: number; p?: number }): any {
            return { old: true, params };
          },
          searchV2(params: { pageSize?: number; page?: number }): any {
            return { new: true, params };
          },
        };
      }

      // Register mapping
      CompatibilityBridge.register({
        oldApi: 'users.search',
        newApi: 'users.searchV2',
        transformer: (params: any) => {
          const v2Params: any = {};
          if (params.ps) {
            v2Params.pageSize = params.ps;
          }
          if (params.p) {
            v2Params.page = params.p;
          }
          return v2Params;
        },
      });

      const client = new ApiClient();
      const proxiedClient = CompatibilityBridge.createProxy(client);

      // Call old API
      const result = proxiedClient.users.search({ ps: 10, p: 2 });

      // Should have called new API with transformed params
      expect(result).toEqual({
        new: true,
        params: { pageSize: 10, page: 2 },
      });

      // Should have emitted deprecation warning
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.search'));
    });

    it('should handle result transformation', async () => {
      class ApiClient {
        async getItems(): Promise<{ items: string[] }> {
          return { items: ['a', 'b'] };
        }

        async getItemsV2(): Promise<{ data: string[] }> {
          return { data: ['a', 'b'] };
        }
      }

      CompatibilityBridge.register({
        oldApi: 'getItems',
        newApi: 'getItemsV2',
        resultTransformer: (result: any) => ({
          items: result.data,
        }),
      });

      const client = new ApiClient();
      const proxied = withCompatibility(client, [
        {
          oldApi: 'getItems',
          newApi: 'getItemsV2',
          resultTransformer: (result: any) => ({
            items: result.data,
          }),
        },
      ]);

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await proxied.getItems();
      expect(result).toEqual({ items: ['a', 'b'] });
    });
  });

  describe('Migration Assistant', () => {
    beforeEach(() => {
      // Register some test metadata
      DeprecationRegistry.register({
        api: 'oldApi1',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-01',
        replacement: 'newApi1',
        reason: 'Performance improvements',
        automaticMigration: true,
        examples: [
          {
            before: 'client.oldApi1()',
            after: 'client.newApi1()',
          },
        ],
      });

      DeprecationRegistry.register({
        api: 'oldApi2',
        deprecatedSince: '1.1.0',
        removalDate: '2025-07-01',
        replacement: 'newApi2',
        reason: 'Security fixes',
        breakingChanges: ['Parameter order changed'],
      });
    });

    it('should analyze usage and generate report', () => {
      const usageData = [
        {
          api: 'oldApi1',
          file: 'src/file1.ts',
          line: 10,
          column: 5,
          code: 'client.oldApi1()',
        },
        {
          api: 'oldApi1',
          file: 'src/file2.ts',
          line: 20,
          column: 10,
          code: 'await client.oldApi1()',
        },
        {
          api: 'oldApi2',
          file: 'src/file3.ts',
          line: 30,
          column: 15,
          code: 'this.oldApi2(a, b)',
        },
      ];

      const report = MigrationAssistant.analyzeUsage(usageData);

      expect(report.totalDeprecations).toBe(3);
      expect(report.byApi).toEqual({
        oldApi1: 2,
        oldApi2: 1,
      });
      expect(report.suggestions).toHaveLength(3);
      expect(report.estimatedEffort).toBe('Low (< 1 hour)');

      // Check automatic fix generation
      const firstSuggestion = report.suggestions[0];
      expect(firstSuggestion.automaticFix).toBe('client.newApi1()');
      expect(firstSuggestion.example).toBeDefined();
    });

    it('should generate migration guide', () => {
      const guide = MigrationAssistant.generateMigrationGuide();

      expect(guide).toContain('# API Migration Guide');
      expect(guide).toContain('oldApi1');
      expect(guide).toContain('oldApi2');
      expect(guide).toContain('Performance improvements');
      expect(guide).toContain('Security fixes');
      expect(guide).toContain('Parameter order changed');
    });
  });

  describe('Deprecation Registry', () => {
    it('should generate timeline report', () => {
      DeprecationRegistry.register({
        api: 'api1',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-01',
        reason: 'Test reason 1',
      });

      DeprecationRegistry.register({
        api: 'api2',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-01',
        reason: 'Test reason 2',
      });

      DeprecationRegistry.register({
        api: 'api3',
        deprecatedSince: '1.1.0',
        removalDate: '2025-07-01',
        reason: 'Test reason 3',
      });

      const report = DeprecationRegistry.generateReport();

      expect(report).toContain('# Deprecation Timeline');
      expect(report).toContain('## Removals scheduled for 2025-06-01');
      expect(report).toContain('## Removals scheduled for 2025-07-01');
      expect(report).toContain('api1');
      expect(report).toContain('api2');
      expect(report).toContain('api3');
    });

    it('should filter by tags', () => {
      DeprecationRegistry.register({
        api: 'taggedApi1',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-01',
        reason: 'Test',
        tags: ['security', 'breaking'],
      });

      DeprecationRegistry.register({
        api: 'taggedApi2',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-01',
        reason: 'Test',
        tags: ['performance'],
      });

      const securityApis = DeprecationRegistry.getByTag('security');
      expect(securityApis).toHaveLength(1);
      expect(securityApis[0].api).toBe('taggedApi1');
    });
  });
});
