/**
 * Enhanced deprecation metadata system for better tooling integration
 */

export interface MigrationExample {
  before: string;
  after: string;
  description?: string;
}

export interface DeprecationMetadata {
  /** The deprecated API identifier */
  api: string;
  /** When the API was deprecated */
  deprecatedSince: string;
  /** When the API will be removed */
  removalDate: string;
  /** The replacement API */
  replacement?: string;
  /** Detailed reason for deprecation */
  reason: string;
  /** Migration examples */
  examples?: MigrationExample[];
  /** Breaking changes between old and new API */
  breakingChanges?: string[];
  /** Tags for categorization */
  tags?: string[];
  /** Link to full migration guide */
  migrationGuide?: string;
  /** Whether automatic migration is possible */
  automaticMigration?: boolean;
}

/**
 * Registry for all deprecation metadata
 */
export class DeprecationRegistry {
  private static readonly metadata = new Map<string, DeprecationMetadata>();

  static register(metadata: DeprecationMetadata): void {
    this.metadata.set(metadata.api, metadata);
  }

  static get(api: string): DeprecationMetadata | undefined {
    return this.metadata.get(api);
  }

  static getAll(): DeprecationMetadata[] {
    return Array.from(this.metadata.values());
  }

  static getByTag(tag: string): DeprecationMetadata[] {
    return this.getAll().filter((m) => m.tags?.includes(tag));
  }

  static getByRemovalDate(before: Date): DeprecationMetadata[] {
    return this.getAll().filter((m) => new Date(m.removalDate) <= before);
  }

  /**
   * Export metadata for external tooling
   */
  static export(): string {
    return JSON.stringify(Array.from(this.metadata.values()));
  }

  static clear(): void {
    this.metadata.clear();
  }

  static getTimeline(): DeprecationMetadata[] {
    return this.getAll()
      .filter((m) => m.removalDate && !isNaN(new Date(m.removalDate).getTime()))
      .sort((a, b) => new Date(a.removalDate).getTime() - new Date(b.removalDate).getTime());
  }

  /**
   * Generate migration report
   */
  static generateReport(): string {
    const metadata = this.getAll();
    const grouped = metadata.reduce<Record<string, DeprecationMetadata[]>>((acc, m) => {
      const date = m.removalDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(m);
      return acc;
    }, {});

    let report = '# Deprecation Timeline\n\n';

    Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, items]) => {
        report += `## Removals scheduled for ${date}\n\n`;
        items.forEach((item) => {
          report += `### ${item.api}\n`;
          report += `- **Deprecated since:** ${item.deprecatedSince}\n`;
          report += `- **Reason:** ${item.reason}\n`;
          if (item.replacement) {
            report += `- **Replacement:** ${item.replacement}\n`;
          }
          if (item.migrationGuide) {
            report += `- **Migration guide:** ${item.migrationGuide}\n`;
          }
          report += '\n';
        });
      });

    return report;
  }
}
