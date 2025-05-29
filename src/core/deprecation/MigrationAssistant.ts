/**
 * Migration assistant for helping developers migrate from deprecated APIs
 */

import type { MigrationExample, DeprecationMetadata } from './DeprecationMetadata';
import { DeprecationRegistry } from './DeprecationMetadata';

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

      // Generate suggestion
      const suggestion: MigrationSuggestion = {
        file: usage.file,
        line: usage.line,
        column: usage.column,
        deprecatedApi: usage.api,
        suggestion: this.generateSuggestion(metadata),
      };

      // Add example if available
      if (metadata.examples && metadata.examples.length > 0) {
        const firstExample = metadata.examples[0];
        if (firstExample) {
          suggestion.example = firstExample;
        }
      }

      // Generate automatic fix if possible
      if (metadata.automaticMigration === true && metadata.replacement) {
        suggestion.automaticFix = this.generateAutomaticFix(
          usage.code,
          usage.api,
          metadata.replacement
        );
      }

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
    const escaped = api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\\(\\\(\\\))/g, '\\s*\\(');
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
    const byRemovalDate = allMetadata.reduce<Record<string, DeprecationMetadata[]>>((acc, m) => {
      const date = m.removalDate;
      acc[date] ??= [];
      acc[date].push(m);
      return acc;
    }, {});

    let guide = '# API Migration Guide\n\n';
    guide += 'This guide helps you migrate from deprecated APIs to their replacements.\n\n';

    // Add urgency section
    const urgentApis = allMetadata.filter((m) => {
      const daysUntilRemoval = Math.ceil(
        (new Date(m.removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilRemoval <= 30 && daysUntilRemoval > 0;
    });

    if (urgentApis.length > 0) {
      guide += '## ⚠️ Urgent Migrations\n\n';
      guide += 'These APIs will be removed within 30 days:\n\n';
      urgentApis.forEach((api) => {
        const days = Math.ceil(
          (new Date(api.removalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        guide += `- **${api.api}** - ${days} days remaining\n`;
      });
      guide += '\n';
    }

    // Add detailed migration instructions
    guide += '## Migration Instructions\n\n';

    Object.entries(byRemovalDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, apis]) => {
        guide += `### APIs to be removed on ${date}\n\n`;

        apis.forEach((api) => {
          guide += `#### ${api.api}\n\n`;
          guide += `**Deprecated since:** ${api.deprecatedSince}\n\n`;
          guide += `**Reason:** ${api.reason}\n\n`;

          if (api.replacement) {
            guide += `**Replacement:** \`${api.replacement}\`\n\n`;
          }

          if (api.breakingChanges && api.breakingChanges.length > 0) {
            guide += '**Breaking Changes:**\n';
            api.breakingChanges.forEach((change) => {
              guide += `- ${change}\n`;
            });
            guide += '\n';
          }

          if (api.examples && api.examples.length > 0) {
            guide += '**Examples:**\n\n';
            api.examples.forEach((ex, i) => {
              guide += `Example ${i + 1}${ex.description ? `: ${ex.description}` : ''}\n\n`;
              guide += `Before:\n\`\`\`typescript\n${ex.before}\n\`\`\`\n\n`;
              guide += `After:\n\`\`\`typescript\n${ex.after}\n\`\`\`\n\n`;
            });
          }

          if (api.migrationGuide) {
            guide += `📖 [Full Migration Guide](${api.migrationGuide})\n\n`;
          }

          guide += '---\n\n';
        });
      });

    return guide;
  }
}
