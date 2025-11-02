/**
 * Migration assistant for helping developers migrate from deprecated APIs
 */

import type { MigrationExample, DeprecationMetadata } from './DeprecationMetadata.js';
import { DeprecationRegistry } from './DeprecationMetadata.js';

export interface MigrationSuggestion {
  file: string;
  line: number;
  column: number;
  deprecatedApi: string;
  suggestion: string;
  example?: MigrationExample;
  automaticFix?: string;
}

export interface MigrationReport {
  totalDeprecations: number;
  byApi: Record<string, number>;
  suggestions: MigrationSuggestion[];
  estimatedEffort: string;
}

interface UsageData {
  api: string;
  file: string;
  line: number;
  column: number;
  code: string;
}

/**
 * Provides tools to help developers migrate from deprecated APIs
 */
export class MigrationAssistant {
  private constructor() {
    // Private constructor to prevent instantiation
  }

  /**
   * Analyze code usage and generate migration suggestions
   */
  static analyzeUsage(usageData: UsageData[]): MigrationReport {
    const suggestions: MigrationSuggestion[] = [];
    const apiCounts: Record<string, number> = {};

    for (const usage of usageData) {
      const metadata = DeprecationRegistry.get(usage.api);
      if (!metadata) {
        continue;
      }

      // Count usage
      apiCounts[usage.api] = (apiCounts[usage.api] ?? 0) + 1;

      // Generate and add suggestion
      const suggestion = this.createMigrationSuggestion(usage, metadata);
      suggestions.push(suggestion);
    }

    return {
      totalDeprecations: suggestions.length,
      byApi: apiCounts,
      suggestions,
      estimatedEffort: this.estimateEffort(suggestions.length),
    };
  }

  /**
   * Create a migration suggestion for a specific usage
   * @private
   */
  private static createMigrationSuggestion(
    usage: UsageData,
    metadata: DeprecationMetadata,
  ): MigrationSuggestion {
    const suggestion: MigrationSuggestion = {
      file: usage.file,
      line: usage.line,
      column: usage.column,
      deprecatedApi: usage.api,
      suggestion: this.generateSuggestion(metadata),
    };

    // Add example if available
    this.addExampleToSuggestion(suggestion, metadata);

    // Generate automatic fix if possible
    this.addAutomaticFixToSuggestion(suggestion, usage, metadata);

    return suggestion;
  }

  /**
   * Add example to suggestion if available
   * @private
   */
  private static addExampleToSuggestion(
    suggestion: MigrationSuggestion,
    metadata: DeprecationMetadata,
  ): void {
    if (metadata.examples && metadata.examples.length > 0) {
      const firstExample = metadata.examples[0];
      if (firstExample) {
        suggestion.example = firstExample;
      }
    }
  }

  /**
   * Add automatic fix to suggestion if possible
   * @private
   */
  private static addAutomaticFixToSuggestion(
    suggestion: MigrationSuggestion,
    usage: UsageData,
    metadata: DeprecationMetadata,
  ): void {
    if (metadata.automaticMigration === true && metadata.replacement) {
      suggestion.automaticFix = this.generateAutomaticFix(
        usage.code,
        usage.api,
        metadata.replacement,
      );
    }
  }

  /**
   * Generate a human-readable suggestion
   */
  private static generateSuggestion(metadata: DeprecationMetadata): string {
    let suggestion = `Replace '${metadata.api}' with '${metadata.replacement ?? 'newer API'}'.`;

    if (metadata.reason) {
      suggestion += ` Reason: ${metadata.reason}`;
    }

    if (metadata.breakingChanges && metadata.breakingChanges.length > 0) {
      suggestion += ` Note: This migration includes breaking changes: ${metadata.breakingChanges.join(', ')}`;
    }

    return suggestion;
  }

  /**
   * Generate automatic fix for simple cases
   */
  private static generateAutomaticFix(code: string, oldApi: string, newApi: string): string {
    // Simple string replacement for method calls
    const oldPattern = this.apiToRegex(oldApi);
    return code.replace(oldPattern, newApi);
  }

  /**
   * Convert API string to regex pattern
   */
  private static apiToRegex(api: string): RegExp {
    // Handle method calls like "users.search()"
    const escaped = api.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const pattern = escaped.replaceAll(/\\(\\\(\\\))/g, String.raw`\s*\(`);
    return new RegExp(pattern, 'g');
  }

  /**
   * Estimate migration effort
   */
  private static estimateEffort(count: number): string {
    if (count === 0) {
      return 'No migration needed';
    }
    if (count <= 10) {
      return 'Low (< 1 hour)';
    }
    if (count <= 50) {
      return 'Medium (1-4 hours)';
    }
    if (count <= 200) {
      return 'High (1-2 days)';
    }
    return 'Very High (> 2 days)';
  }

  /**
   * Generate a migration guide document
   */
  static generateMigrationGuide(): string {
    const allMetadata = DeprecationRegistry.getAll();
    const byRemovalDate = this.groupMetadataByRemovalDate(allMetadata);

    let guide = '# API Migration Guide\n\n';
    guide += 'This guide helps you migrate from deprecated APIs to their replacements.\n\n';

    // Add urgency section
    guide += this.generateUrgencySection(allMetadata);

    // Add detailed migration instructions
    guide += '## Migration Instructions\n\n';
    guide += this.generateMigrationInstructions(byRemovalDate);

    return guide;
  }

  /**
   * Group metadata by removal date
   * @private
   */
  private static groupMetadataByRemovalDate(
    allMetadata: DeprecationMetadata[],
  ): Record<string, DeprecationMetadata[]> {
    return allMetadata.reduce<Record<string, DeprecationMetadata[]>>((acc, m) => {
      const date = m.removalDate;
      acc[date] ??= [];
      acc[date].push(m);
      return acc;
    }, {});
  }

  /**
   * Generate urgency section for APIs being removed soon
   * @private
   */
  private static generateUrgencySection(allMetadata: DeprecationMetadata[]): string {
    const urgentApis = this.findUrgentApis(allMetadata);

    if (urgentApis.length === 0) {
      return '';
    }

    let section = '## ⚠️ Urgent Migrations\n\n';
    section += 'These APIs will be removed within 30 days:\n\n';

    for (const api of urgentApis) {
      const days = this.calculateDaysUntilRemoval(api.removalDate);
      section += `- **${api.api}** - ${days} days remaining\n`;
    }
    section += '\n';

    return section;
  }

  /**
   * Find APIs that are being removed within 30 days
   * @private
   */
  private static findUrgentApis(allMetadata: DeprecationMetadata[]): DeprecationMetadata[] {
    return allMetadata.filter((m) => {
      const daysUntilRemoval = this.calculateDaysUntilRemoval(m.removalDate);
      return daysUntilRemoval <= 30 && daysUntilRemoval > 0;
    });
  }

  /**
   * Calculate days until removal
   * @private
   */
  private static calculateDaysUntilRemoval(removalDate: string): number {
    return Math.ceil((new Date(removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate migration instructions for all APIs
   * @private
   */
  private static generateMigrationInstructions(
    byRemovalDate: Record<string, DeprecationMetadata[]>,
  ): string {
    let instructions = '';

    for (const [date, apis] of Object.entries(byRemovalDate).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
    )) {
      instructions += `### APIs to be removed on ${date}\n\n`;
      instructions += this.generateApiSections(apis);
    }

    return instructions;
  }

  /**
   * Generate sections for each API
   * @private
   */
  private static generateApiSections(apis: DeprecationMetadata[]): string {
    let sections = '';

    for (const api of apis) {
      sections += this.generateApiSection(api);
    }

    return sections;
  }

  /**
   * Generate a section for a single API
   * @private
   */
  private static generateApiSection(api: DeprecationMetadata): string {
    let section = `#### ${api.api}\n\n`;
    section += `**Deprecated since:** ${api.deprecatedSince}\n\n`;
    section += `**Reason:** ${api.reason}\n\n`;

    if (api.replacement) {
      section += `**Replacement:** \`${api.replacement}\`\n\n`;
    }

    section += this.formatBreakingChanges(api.breakingChanges);
    section += this.formatExamples(api.examples);

    if (api.migrationGuide) {
      section += `📖 [Full Migration Guide](${api.migrationGuide})\n\n`;
    }

    section += '---\n\n';

    return section;
  }

  /**
   * Format breaking changes section
   * @private
   */
  private static formatBreakingChanges(breakingChanges?: string[]): string {
    if (!breakingChanges || breakingChanges.length === 0) {
      return '';
    }

    let section = '**Breaking Changes:**\n';
    for (const change of breakingChanges) {
      section += `- ${change}\n`;
    }
    section += '\n';

    return section;
  }

  /**
   * Format examples section
   * @private
   */
  private static formatExamples(examples?: MigrationExample[]): string {
    if (!examples || examples.length === 0) {
      return '';
    }

    let section = '**Examples:**\n\n';
    for (const [i, ex] of examples.entries()) {
      section += MigrationAssistant.formatExampleSection(ex, i + 1);
    }

    return section;
  }

  /**
   * Format an example section with title, description, and code blocks
   * @private
   */
  private static formatExampleSection(ex: MigrationExample, exampleNumber: number): string {
    const title = this.formatExampleTitle(exampleNumber, ex.description);
    const beforeBlock = this.formatCodeBlock('Before', ex.before);
    const afterBlock = this.formatCodeBlock('After', ex.after);

    return `${title}\n\n${beforeBlock}\n\n${afterBlock}\n\n`;
  }

  /**
   * Format example title with optional description
   * @private
   */
  private static formatExampleTitle(exampleNumber: number, description?: string): string {
    const baseTitle = `Example ${exampleNumber}`;
    return description ? `${baseTitle}: ${description}` : baseTitle;
  }

  /**
   * Format a code block with label
   * @private
   */
  private static formatCodeBlock(label: string, code: string): string {
    return `${label}:\n\`\`\`typescript\n${code}\n\`\`\``;
  }
}
