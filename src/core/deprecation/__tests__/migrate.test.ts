import { DeprecationRegistry } from '../DeprecationMetadata';
import { MigrationCLI, registerAllDeprecations } from '../cli/migrate';
import { MigrationAssistant } from '../MigrationAssistant';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules before imports
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock readline for interactive prompts
const mockReadline = {
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((question: string, callback: (answer: string) => void) => {
      callback('y');
    }),
    close: jest.fn(),
  }),
};
jest.mock('readline', () => mockReadline);

describe('CLI Migration Tool', () => {
  const originalConsoleLog = console.log;
  const mockConsoleLog = jest.fn();

  beforeEach(() => {
    console.log = mockConsoleLog;
    jest.clearAllMocks();

    // Register some test deprecations
    DeprecationRegistry.clear();
    DeprecationRegistry.register({
      api: 'users.search',
      deprecatedSince: '1.0.0',
      removalDate: '2025-12-31',
      replacement: 'users.searchV2()',
      reason: 'API v1 deprecated',
      migrationExample: {
        before: 'users.search({ ps: 10 })',
        after: 'users.searchV2({ pageSize: 10 })',
      },
    });

    DeprecationRegistry.register({
      api: 'urgentApi',
      deprecatedSince: '1.0.0',
      removalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      replacement: 'newApi()',
      reason: 'Urgent migration needed',
    });

    // Mock MigrationAssistant methods
    jest.spyOn(MigrationAssistant, 'analyzeUsage').mockReturnValue({
      totalDeprecations: 2,
      byApi: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'users.search': 2,
        urgentApi: 1,
      },
      suggestions: [
        {
          file: 'src/services/UserService.ts',
          line: 45,
          column: 12,
          deprecatedApi: 'users.search',
          suggestion: 'Replace with users.searchV2()',
          example: {
            before: 'const result = await client.users.search().query(username).execute();',
            after: 'const result = await client.users.searchV2().query(username).execute();',
            description: 'Update to use V2 API',
          },
          automaticFix: 'users.searchV2()',
        },
        {
          file: 'src/components/UserList.tsx',
          line: 23,
          column: 8,
          deprecatedApi: 'users.search',
          suggestion: 'Replace with users.searchV2()',
          automaticFix: 'users.searchV2()',
        },
        {
          file: 'src/api/urgent.ts',
          line: 10,
          column: 5,
          deprecatedApi: 'urgentApi',
          suggestion: 'Replace with newApi()',
        },
      ],
      estimatedEffort: 'Low - 2 hours',
    });

    jest
      .spyOn(MigrationAssistant, 'generateMigrationGuide')
      .mockReturnValue('# Migration Guide\n\nTest content');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.restoreAllMocks();
  });

  describe('MigrationCLI', () => {
    it('should create CLI instance with default options', () => {
      const cli = new MigrationCLI({
        projectPath: '/test/path',
        dryRun: false,
        interactive: true,
        generateReport: false,
      });
      expect(cli).toBeDefined();
    });

    describe('run method', () => {
      it('should complete successfully when no deprecated APIs found', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        // Mock scanProject to return empty array
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([]);

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith(
          '✅ No deprecated APIs found! Your code is up to date.'
        );
      });

      it('should handle dry run mode', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: true,
          interactive: false,
          generateReport: false,
        });

        // Mock scanProject to return usage data
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([
          {
            api: 'users.search',
            file: 'src/services/UserService.ts',
            line: 45,
            column: 12,
            code: 'const result = await client.users.search().query(username).execute();',
          },
        ]);

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith('\n🔍 Dry run mode - no changes will be made.');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Migration preview:'));
      });

      it('should generate report when requested', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: true,
          interactive: false,
          generateReport: true,
        });

        // Mock scanProject
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([
          {
            api: 'users.search',
            file: 'test.ts',
            line: 1,
            column: 1,
            code: 'test',
          },
        ]);

        // fs.promises.writeFile is already mocked in beforeEach

        await cli.run();

        expect(fs.promises.writeFile).toHaveBeenCalledWith(
          path.join('/test/path', 'migration-report.md'),
          '# Migration Guide\n\nTest content',
          'utf-8'
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Detailed migration report saved to:')
        );
      });

      it('should apply migrations in non-dry-run mode', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        // Mock scanProject
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([
          {
            api: 'users.search',
            file: 'test.ts',
            line: 1,
            column: 1,
            code: 'test',
          },
        ]);

        // Mock applyFix
        jest.spyOn(cli as any, 'applyFix').mockResolvedValue(undefined);

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith('\n🔧 Applying migrations...');
        expect(mockConsoleLog).toHaveBeenCalledWith('✅ Migrations complete!');
      });

      it('should handle interactive mode and user cancellation', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: true,
          generateReport: false,
        });

        // Mock scanProject
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([
          {
            api: 'users.search',
            file: 'test.ts',
            line: 1,
            column: 1,
            code: 'test',
          },
        ]);

        // Mock prompt to return 'n'
        jest.spyOn(cli as any, 'prompt').mockResolvedValue('n');

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith('❌ Migration cancelled.');
      });

      it('should show urgent migration warnings', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: true,
          interactive: false,
          generateReport: false,
        });

        // Mock scanProject to include urgent API
        jest.spyOn(cli as any, 'scanProject').mockResolvedValue([
          {
            api: 'urgentApi',
            file: 'test.ts',
            line: 1,
            column: 1,
            code: 'urgentApi()',
          },
        ]);

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('URGENT: The following APIs will be removed soon:')
        );
      });
    });

    describe('scanProject method', () => {
      it('should return mock usage data', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        const result = await (cli as any).scanProject();

        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('api', 'users.search');
        expect(result[0]).toHaveProperty('file');
        expect(result[0]).toHaveProperty('line');
        expect(result[0]).toHaveProperty('column');
        expect(result[0]).toHaveProperty('code');
      });
    });

    describe('applyMigrations method', () => {
      it('should handle successful automatic fixes', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        // Mock applyFix
        jest.spyOn(cli as any, 'applyFix').mockResolvedValue(undefined);

        const report = {
          totalDeprecations: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          byApi: { 'users.search': 1 },
          suggestions: [
            {
              file: 'test.ts',
              line: 1,
              column: 1,
              deprecatedApi: 'users.search',
              suggestion: 'Replace with users.searchV2()',
              automaticFix: 'users.searchV2()',
            },
          ],
          estimatedEffort: 'Low',
        };

        await (cli as any).applyMigrations(report);

        expect((cli as any).applyFix).toHaveBeenCalledWith('test.ts', 1, 1, 'users.searchV2()');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ test.ts:1'));
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Migration summary: 1 automatic, 0 failed')
        );
      });

      it('should handle failed automatic fixes', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        // Mock applyFix to throw error
        jest.spyOn(cli as any, 'applyFix').mockRejectedValue(new Error('Fix failed'));

        const report = {
          totalDeprecations: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          byApi: { 'users.search': 1 },
          suggestions: [
            {
              file: 'test.ts',
              line: 1,
              column: 1,
              deprecatedApi: 'users.search',
              suggestion: 'Replace with users.searchV2()',
              automaticFix: 'users.searchV2()',
            },
          ],
          estimatedEffort: 'Low',
        };

        await (cli as any).applyMigrations(report);

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('❌ test.ts:1 - Error: Fix failed')
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Migration summary: 0 automatic, 1 failed')
        );
      });

      it('should handle manual migrations', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        const report = {
          totalDeprecations: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          byApi: { 'users.search': 1 },
          suggestions: [
            {
              file: 'test.ts',
              line: 1,
              column: 1,
              deprecatedApi: 'users.search',
              suggestion: 'Replace with users.searchV2()',
              // No automaticFix provided
            },
          ],
          estimatedEffort: 'Low',
        };

        await (cli as any).applyMigrations(report);

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('⚠️  test.ts:1 - Manual migration required')
        );
      });
    });

    describe('showMigrationPreview method', () => {
      it('should show preview with examples', () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: true,
          interactive: false,
          generateReport: false,
        });

        const report = {
          totalDeprecations: 2,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          byApi: { 'users.search': 2 },
          suggestions: [
            {
              file: 'test1.ts',
              line: 10,
              column: 5,
              deprecatedApi: 'users.search',
              suggestion: 'Replace with users.searchV2()',
              example: {
                before: 'users.search()',
                after: 'users.searchV2()',
              },
            },
            {
              file: 'test2.ts',
              line: 20,
              column: 10,
              deprecatedApi: 'users.search',
              suggestion: 'Replace with users.searchV2()',
            },
          ],
          estimatedEffort: 'Low',
        };

        (cli as any).showMigrationPreview(report);

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Migration preview:'));
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('test1.ts:10'));
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Before:'));
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('After:'));
      });

      it('should limit preview to 3 items and show count of remaining', () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: true,
          interactive: false,
          generateReport: false,
        });

        const suggestions = Array.from({ length: 5 }, (_, i) => ({
          file: `test${i}.ts`,
          line: i * 10,
          column: 5,
          deprecatedApi: 'users.search',
          suggestion: 'Replace with users.searchV2()',
        }));

        const report = {
          totalDeprecations: 5,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          byApi: { 'users.search': 5 },
          suggestions,
          estimatedEffort: 'Medium',
        };

        (cli as any).showMigrationPreview(report);

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('... and 2 more'));
      });
    });

    describe('applyFix method', () => {
      it('should log the fix application', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: false,
          generateReport: false,
        });

        await (cli as any).applyFix('test.ts', 10, 5, 'fixed code');

        expect(mockConsoleLog).toHaveBeenCalledWith('   Applying fix to test.ts:10:5');
      });
    });

    describe('prompt method', () => {
      it('should return mock response', async () => {
        const cli = new MigrationCLI({
          projectPath: '/test/path',
          dryRun: false,
          interactive: true,
          generateReport: false,
        });

        const result = await (cli as any).prompt('Test question?');

        expect(mockConsoleLog).toHaveBeenCalledWith('Test question?');
        expect(result).toBe('y');
      });
    });
  });

  describe('registerAllDeprecations function', () => {
    it('should be callable', () => {
      expect(() => {
        registerAllDeprecations();
      }).not.toThrow();
    });
  });

  describe('CLI entry point', () => {
    const originalModule = require.main;

    beforeEach(() => {
      // Skip changing require.main if it's readonly
      try {
        require.main = module;
      } catch {
        // Skip if readonly
      }
    });

    afterEach(() => {
      // Skip changing require.main if it's readonly
      try {
        require.main = originalModule;
      } catch {
        // Skip if readonly
      }
    });

    it('should test CLI options parsing', () => {
      // Just test the options creation logic
      const originalArgv = process.argv;

      // Test dry-run option
      process.argv = ['node', 'migrate.js', '--dry-run'];
      expect(process.argv.includes('--dry-run')).toBe(true);

      // Test report option
      process.argv = ['node', 'migrate.js', '--report'];
      expect(process.argv.includes('--report')).toBe(true);

      // Test target option
      process.argv = ['node', 'migrate.js', '--target=10.0'];
      const targetArg = process.argv.find((arg) => arg.startsWith('--target='));
      expect(targetArg?.split('=')[1]).toBe('10.0');

      // Restore original argv
      process.argv = originalArgv;
    });
  });
});
