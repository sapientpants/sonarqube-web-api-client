#!/usr/bin/env node

/**
 * CLI tool for automatic migration of deprecated SonarQube API usage
 * Usage: npx sonarqube-client-migrate [options]
 */

import { DeprecationRegistry, MigrationAssistant } from '../index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface MigrationOptions {
  projectPath: string;
  dryRun: boolean;
  interactive: boolean;
  generateReport: boolean;
  targetVersion?: string | undefined;
}

interface UsageData {
  api: string;
  file: string;
  line: number;
  column: number;
  code: string;
}

interface Suggestion {
  file: string;
  line: number;
  column: number;
  deprecatedApi: string;
  suggestion: string;
  example?: {
    before: string;
    after: string;
    description?: string;
  };
  automaticFix?: string;
}

interface Report {
  totalDeprecations: number;
  byApi: Record<string, number>;
  suggestions: Suggestion[];
  estimatedEffort: string;
}

class MigrationCLI {
  private readonly options: MigrationOptions;

  constructor(options: MigrationOptions) {
    this.options = options;
  }

  async run(): Promise<void> {
    console.log('🔄 SonarQube Client Migration Tool\n');

    // Step 1: Scan project for deprecated API usage
    console.log('📍 Scanning project for deprecated API usage...');
    const usageData = await this.scanProject();

    if (usageData.length === 0) {
      console.log('✅ No deprecated APIs found! Your code is up to date.');
      return;
    }

    // Step 2: Generate migration report
    const report = MigrationAssistant.analyzeUsage(usageData);
    console.log(`\n📊 Found ${report.totalDeprecations} deprecated API calls:`);

    for (const [api, count] of Object.entries(report.byApi)) {
      const metadata = DeprecationRegistry.get(api);
      console.log(
        `   - ${api}: ${count} usage${count > 1 ? 's' : ''} (removes ${metadata?.removalDate ?? 'unknown'})`,
      );
    }

    console.log(`\n⏱️  Estimated migration effort: ${report.estimatedEffort}`);

    // Step 3: Show migration plan
    if (this.options.generateReport) {
      await this.generateDetailedReport(report);
    }

    // Step 4: Apply migrations
    if (this.options.dryRun) {
      console.log('\n🔍 Dry run mode - no changes will be made.');
      this.showMigrationPreview(report);
    } else {
      if (this.options.interactive) {
        const proceed = await this.prompt('\n🤔 Apply automatic migrations? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
          console.log('❌ Migration cancelled.');
          return;
        }
      }

      console.log('\n🔧 Applying migrations...');
      await this.applyMigrations(report);
      console.log('✅ Migrations complete!');
    }

    // Step 5: Post-migration advice
    this.showPostMigrationAdvice(report);
  }

  private async scanProject(): Promise<UsageData[]> {
    // In a real implementation, this would use TypeScript compiler API
    // or a code analysis tool to find deprecated API usage
    console.log('   Analyzing TypeScript files...');

    // Mock data for demonstration
    return [
      {
        api: 'users.search',
        file: 'src/services/UserService.ts',
        line: 45,
        column: 12,
        code: 'const result = await client.users.search().query(username).execute();',
      },
      {
        api: 'users.search',
        file: 'src/components/UserList.tsx',
        line: 23,
        column: 8,
        code: 'await sonarClient.users.search().pageSize(100).execute()',
      },
    ];
  }

  private async generateDetailedReport(_report: Report): Promise<void> {
    const reportPath = path.join(this.options.projectPath, 'migration-report.md');
    const content = MigrationAssistant.generateMigrationGuide();

    await fs.promises.writeFile(reportPath, content, 'utf-8');
    console.log(`\n📄 Detailed migration report saved to: ${reportPath}`);
  }

  private async applyMigrations(report: Report): Promise<void> {
    let successCount = 0;
    let failureCount = 0;

    for (const suggestion of report.suggestions) {
      if (suggestion.automaticFix) {
        try {
          await this.applyFix(
            suggestion.file,
            suggestion.line,
            suggestion.column,
            suggestion.automaticFix,
          );
          successCount++;
          console.log(`   ✅ ${suggestion.file}:${suggestion.line}`);
        } catch (error) {
          failureCount++;
          console.log(`   ❌ ${suggestion.file}:${suggestion.line} - ${String(error)}`);
        }
      } else {
        console.log(`   ⚠️  ${suggestion.file}:${suggestion.line} - Manual migration required`);
      }
    }

    console.log(`\n📈 Migration summary: ${successCount} automatic, ${failureCount} failed`);
  }

  private async applyFix(
    filePath: string,
    line: number,
    column: number,
    _fix: string,
  ): Promise<void> {
    // In a real implementation, this would apply the code fix
    // using a proper AST transformation
    console.log(`   Applying fix to ${filePath}:${line}:${column}`);
  }

  private showMigrationPreview(report: Report): void {
    console.log('\n📝 Migration preview:');

    for (const suggestion of report.suggestions.slice(0, 3)) {
      console.log(`\n${suggestion.file}:${suggestion.line}`);
      console.log(`  ${suggestion.suggestion}`);

      if (suggestion.example) {
        console.log('\n  Before:');
        console.log(`  ${suggestion.example.before.split('\n').join('\n  ')}`);
        console.log('\n  After:');
        console.log(`  ${suggestion.example.after.split('\n').join('\n  ')}`);
      }
    }

    if (report.suggestions.length > 3) {
      console.log(`\n... and ${report.suggestions.length - 3} more`);
    }
  }

  private showPostMigrationAdvice(report: Report): void {
    console.log('\n💡 Next steps:');
    console.log('1. Run your test suite to ensure everything works');
    console.log('2. Review the changes and commit them');
    console.log('3. Update your dependencies if needed');

    // Check for urgent migrations
    const urgentApis = new Set<string>();
    for (const s of report.suggestions) {
      const metadata = DeprecationRegistry.get(s.deprecatedApi);
      if (metadata) {
        const daysLeft = Math.ceil(
          (new Date(metadata.removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft <= 30) {
          urgentApis.add(s.deprecatedApi);
        }
      }
    }

    if (urgentApis.size > 0) {
      console.log('\n⚠️  URGENT: The following APIs will be removed soon:');
      for (const api of urgentApis) {
        const metadata = DeprecationRegistry.get(api);
        if (metadata) {
          const daysLeft = Math.ceil(
            (new Date(metadata.removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          console.log(`   - ${api} (${daysLeft} days left)`);
        }
      }
    }
  }

  private async prompt(question: string): Promise<string> {
    // In a real implementation, use readline or inquirer
    console.log(question);
    return 'y'; // Mock response
  }
}

/**
 * Example of how to register all deprecations for the CLI tool
 */
export function registerAllDeprecations(): void {
  // Import and register all API deprecations
  // Example: Dynamic import of deprecation registrations
  // void import('../examples/UsersApiExample').then((module) => {
  //   module.registerUsersApiDeprecations();
  // });
  // In a real implementation, you would import and register
  // all API deprecations from the actual resource modules
  // Register other API deprecations...
}

// Export for testing
export { MigrationCLI };

// CLI entry point
if (require.main === module) {
  const options: MigrationOptions = {
    projectPath: process.cwd(),
    dryRun: process.argv.includes('--dry-run'),
    interactive: !process.argv.includes('--no-interactive'),
    generateReport: process.argv.includes('--report'),
    targetVersion: process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1],
  };

  const cli = new MigrationCLI(options);
  void cli.run().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
