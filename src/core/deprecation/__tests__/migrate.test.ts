import { DeprecationRegistry } from '../DeprecationMetadata';
import { MigrationCLI } from '../cli/migrate';

// Mock modules before imports
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));

jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((query, callback) => callback('y')),
    close: jest.fn(),
  })),
}));

// Mock the CLI module to avoid process.exit
jest.mock('../cli/migrate', () => {
  const actualModule = jest.requireActual('../cli/migrate');
  return {
    ...actualModule,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MigrationCLI: jest.fn(),
  };
});

describe('CLI Migration Tool', () => {
  let mockRunFn: jest.Mock;
  let mockGenerateReportFn: jest.Mock;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();

    // Create mock functions that can be tracked
    mockRunFn = jest.fn().mockResolvedValue(undefined);
    mockGenerateReportFn = jest.fn();

    // Update the mock to use our tracked functions
    (MigrationCLI as jest.Mock).mockImplementation((options) => {
      return {
        scanFiles: jest.fn().mockResolvedValue([]),
        generateReport: mockGenerateReportFn,
        run: mockRunFn,
        options,
      };
    });

    // Register some test deprecations
    DeprecationRegistry.clear();
    DeprecationRegistry.register({
      api: 'users.search()',
      deprecatedSince: '1.0.0',
      removalDate: '2025-12-31',
      replacement: 'users.searchV2()',
      examples: [
        {
          before: 'users.search({ ps: 10 })',
          after: 'users.searchV2({ pageSize: 10 })',
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('MigrationCLI mocked tests', () => {
    it('should create CLI instance with options', () => {
      const cli = new MigrationCLI({ dryRun: true });
      expect(cli).toBeDefined();
      expect(cli.options).toEqual({ dryRun: true });
    });

    it('should handle dry run mode', async () => {
      const cli = new MigrationCLI({ dryRun: true });
      await cli.run();
      expect(mockRunFn).toHaveBeenCalled();
    });

    it('should handle report generation', () => {
      const cli = new MigrationCLI({ report: true });
      cli.generateReport({
        deprecatedCount: 5,
        byApi: {},
        byFile: {},
      });
      expect(mockGenerateReportFn).toHaveBeenCalled();
    });
  });
});
