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
    /* eslint-disable no-console */
    console.log('🔄 SonarQube Client Migration Tool\n');

    // Step 1: Scan project for deprecated API usage
    const usageData = await this.scanAndValidateProject();
    if (usageData === null) {
      return; // No deprecated APIs found
    }

    // Step 2: Generate and display migration report
    const report = this.generateAndDisplayReport(usageData);

    // Step 3: Generate detailed report if requested
    await this.handleReportGeneration(report);

    // Step 4: Apply migrations
    await this.handleMigrations(report);

    // Step 5: Post-migration advice
    this.showPostMigrationAdvice(report);
    /* eslint-enable no-console */
  }

  private async scanAndValidateProject(): Promise<UsageData[] | null> {
    /* eslint-disable no-console */
    console.log('📍 Scanning project for deprecated API usage...');
    const usageData = await this.scanProject();

    if (usageData.length === 0) {
      console.log('✅ No deprecated APIs found! Your code is up to date.');
      return null;
    }
    /* eslint-enable no-console */

    return usageData;
  }

  private generateAndDisplayReport(usageData: UsageData[]): Report {
    /* eslint-disable no-console */
    const report = MigrationAssistant.analyzeUsage(usageData);
    console.log(`\n📊 Found ${report.totalDeprecations} deprecated API calls:`);

    this.displayDeprecationSummary(report);
    console.log(`\n⏱️  Estimated migration effort: ${report.estimatedEffort}`);
    /* eslint-enable no-console */

    return report;
  }

  private displayDeprecationSummary(report: Report): void {
    /* eslint-disable no-console */
    for (const [api, count] of Object.entries(report.byApi)) {
      const metadata = DeprecationRegistry.get(api);
      console.log(
        `   - ${api}: ${count} usage${count > 1 ? 's' : ''} (removes ${metadata?.removalDate ?? 'unknown'})`,
      );
    }
    /* eslint-enable no-console */
  }

  private async handleReportGeneration(report: Report): Promise<void> {
    if (this.options.generateReport) {
      await this.generateDetailedReport(report);
    }
  }

  private async handleMigrations(report: Report): Promise<void> {
    if (this.options.dryRun) {
      this.handleDryRun(report);
    } else {
      await this.handleActiveMigration(report);
    }
  }

  private handleDryRun(report: Report): void {
    /* eslint-disable no-console */
    console.log('\n🔍 Dry run mode - no changes will be made.');
    /* eslint-enable no-console */
    this.showMigrationPreview(report);
  }

  private async handleActiveMigration(report: Report): Promise<void> {
    if (this.options.interactive) {
      const shouldProceed = await this.confirmMigration();
      if (!shouldProceed) {
        return;
      }
    }

    await this.executeMigrations(report);
  }

  private async confirmMigration(): Promise<boolean> {
    /* eslint-disable no-console */
    const proceed = await this.prompt('\n🤔 Apply automatic migrations? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('❌ Migration cancelled.');
      return false;
    }
    /* eslint-enable no-console */
    return true;
  }

  private async executeMigrations(report: Report): Promise<void> {
    /* eslint-disable no-console */
    console.log('\n🔧 Applying migrations...');
    await this.applyMigrations(report);
    console.log('✅ Migrations complete!');
    /* eslint-enable no-console */
  }

  private async scanProject(): Promise<UsageData[]> {
    // In a real implementation, this would use TypeScript compiler API
    // or a code analysis tool to find deprecated API usage
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.log(`\n📄 Detailed migration report saved to: ${reportPath}`);
  }

  private async applyMigrations(report: Report): Promise<void> {
    /* eslint-disable no-console */
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
    /* eslint-enable no-console */
  }

  private async applyFix(
    filePath: string,
    line: number,
    column: number,
    _fix: string,
  ): Promise<void> {
    // In a real implementation, this would apply the code fix
    // using a proper AST transformation
    // eslint-disable-next-line no-console
    console.log(`   Applying fix to ${filePath}:${line}:${column}`);
  }

  private showMigrationPreview(report: Report): void {
    /* eslint-disable no-console */
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
    /* eslint-enable no-console */
  }

  private showPostMigrationAdvice(report: Report): void {
    this.displayNextSteps();

    const urgentApis = this.findUrgentApis(report);
    this.displayUrgentWarnings(urgentApis);
  }

  private displayNextSteps(): void {
    /* eslint-disable no-console */
    console.log('\n💡 Next steps:');
    console.log('1. Run your test suite to ensure everything works');
    console.log('2. Review the changes and commit them');
    console.log('3. Update your dependencies if needed');
    /* eslint-enable no-console */
  }

  private findUrgentApis(report: Report): Set<string> {
    const urgentApis = new Set<string>();
    for (const s of report.suggestions) {
      const metadata = DeprecationRegistry.get(s.deprecatedApi);
      if (metadata && this.isUrgent(metadata)) {
        urgentApis.add(s.deprecatedApi);
      }
    }
    return urgentApis;
  }

  private isUrgent(metadata: { removalDate: string }): boolean {
    const daysLeft = this.calculateDaysUntilRemoval(metadata.removalDate);
    return daysLeft <= 30;
  }

  private calculateDaysUntilRemoval(removalDate: string): number {
    return Math.ceil((new Date(removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private displayUrgentWarnings(urgentApis: Set<string>): void {
    if (urgentApis.size === 0) {
      return;
    }

    /* eslint-disable no-console */
    console.log('\n⚠️  URGENT: The following APIs will be removed soon:');
    for (const api of urgentApis) {
      const metadata = DeprecationRegistry.get(api);
      if (metadata) {
        const daysLeft = this.calculateDaysUntilRemoval(metadata.removalDate);
        console.log(`   - ${api} (${daysLeft} days left)`);
      }
    }
    /* eslint-enable no-console */
  }

  private async prompt(question: string): Promise<string> {
    // In a real implementation, use readline or inquirer
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
