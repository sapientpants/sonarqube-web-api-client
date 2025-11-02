/**
 * Utility functions for Clean Code Policy API
 * @since 10.6
 */

import type {
  CreateCustomRuleV2Request,
  CreateCustomRuleV2Response,
  RuleStatus,
  RuleSeverity,
  RuleType,
  SoftwareQuality,
  ImpactSeverity,
  CleanCodeAttribute,
} from './types.js';

/**
 * Rule key utilities
 */
export const ruleKeyUtils = {
  /**
   * Generate a valid rule key from a name
   *
   * @param name - Human readable name
   * @param prefix - Optional prefix for the key
   * @returns Valid rule key
   *
   * @example
   * ```typescript
   * const key = RuleKeyUtils.generateKey('No Console Log'); // 'no-console-log'
   * const key2 = RuleKeyUtils.generateKey('SQL Injection', 'sec'); // 'sec-sql-injection'
   * ```
   */
  generateKey: (name: string, prefix?: string): string => {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let key: string = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

    // Remove leading and trailing hyphens
    key = ruleKeyUtils.trimHyphens(key);

    // Add prefix if provided
    key = ruleKeyUtils.addPrefix(key, prefix);

    // Ensure it starts with a letter
    key = ruleKeyUtils.ensureStartsWithLetter(key);

    // Truncate if too long (max 200 chars is a safe limit)
    key = ruleKeyUtils.truncateKey(key, 200);

    return key;
  },

  /**
   * Trims leading and trailing hyphens from a string
   * @private
   */
  trimHyphens: (key: string): string => {
    const start = key.search(/[^-]/);

    if (start === -1) {
      return '';
    }

    let end = key.length - 1;
    while (end >= 0 && key[end] === '-') {
      end--;
    }

    return key.slice(start, end + 1);
  },

  /**
   * Adds a prefix to the key if provided
   * @private
   */
  addPrefix: (key: string, prefix?: string): string => {
    if (prefix !== undefined && prefix !== '') {
      return `${prefix}-${key}`;
    }
    return key;
  },

  /**
   * Ensures the key starts with a letter
   * @private
   */
  ensureStartsWithLetter: (key: string): string => {
    if (key === '' || !/^[a-z]/.test(key)) {
      return `rule-${key}`;
    }
    return key;
  },

  /**
   * Truncates the key to the specified max length and removes trailing hyphens
   * @private
   */
  truncateKey: (key: string, maxLength: number): string => {
    if (key.length <= maxLength) {
      return key;
    }

    let truncated = key.substring(0, maxLength);
    while (truncated.endsWith('-')) {
      truncated = truncated.slice(0, -1);
    }
    return truncated;
  },

  /**
   * Validate a rule key format
   *
   * @param key - Rule key to validate
   * @returns True if valid, false otherwise
   */
  isValidKey: (key: string): boolean => {
    // Must start with letter, contain only letters, numbers, underscores, hyphens
    if (key.length === 0 || key.length > 200) {
      return false;
    }
    if (!/^[a-zA-Z]/.test(key)) {
      return false;
    }
    // Check each character individually to avoid ReDoS
    for (let i = 1; i < key.length; i++) {
      const char = key[i];
      if (char === undefined || !/[a-zA-Z0-9_-]/.test(char)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Extract repository key from a full rule key
   *
   * @param fullKey - Full rule key (e.g., 'javascript:S1234')
   * @returns Repository key or null if not found
   */
  extractRepositoryKey: (fullKey: string): string | null => {
    const parts = fullKey.split(':');
    return parts.length === 2 ? (parts[0] ?? null) : null;
  },

  /**
   * Extract rule key from a full rule key
   *
   * @param fullKey - Full rule key (e.g., 'javascript:S1234')
   * @returns Rule key or the input if no repository prefix
   */
  extractRuleKey: (fullKey: string): string => {
    const parts = fullKey.split(':');
    return parts.length === 2 && parts[1] !== '' && parts[1] !== undefined ? parts[1] : fullKey;
  },
};

/**
 * Parameter utilities for rule configuration
 */
export const parameterUtils = {
  /**
   * Common parameter configurations
   */
  commonParameters: {
    message: {
      key: 'message',
      name: 'Issue Message',
      htmlDescription: 'The message to display when this rule is violated',
      type: 'STRING',
    },
    pattern: {
      key: 'pattern',
      name: 'Pattern',
      htmlDescription: 'Regular expression pattern to match',
      type: 'STRING',
    },
    xpath: {
      key: 'xpath',
      name: 'XPath Expression',
      htmlDescription: 'XPath expression to match code elements',
      type: 'TEXT',
    },
    flags: {
      key: 'flags',
      name: 'Regex Flags',
      htmlDescription: 'Regular expression flags (g, i, m, s, etc.)',
      type: 'STRING',
      defaultValue: 'g',
    },
    maximumLineLength: {
      key: 'maximumLineLength',
      name: 'Maximum Line Length',
      htmlDescription: 'Maximum number of characters allowed per line',
      type: 'INTEGER',
      defaultValue: '120',
    },
    threshold: {
      key: 'threshold',
      name: 'Threshold',
      htmlDescription: 'Threshold value for the rule',
      type: 'INTEGER',
    },
  } as const,

  /**
   * Create a parameter configuration helper
   *
   * @param key - Parameter key
   * @param value - Parameter value
   * @returns Parameter configuration object
   */
  createParameter(key: string, value: string): { key: string; value: string } {
    return { key, value };
  },

  /**
   * Convert a map of parameters to array format
   *
   * @param params - Parameter map
   * @returns Array of parameter configurations
   */
  fromMap(params: Record<string, string>): Array<{ key: string; value: string }> {
    return Object.entries(params).map(([key, value]) => ({ key, value }));
  },

  /**
   * Convert array of parameters to map format
   *
   * @param params - Array of parameters
   * @returns Parameter map
   */
  toMap(params: Array<{ key: string; value: string }>): Record<string, string> {
    return params.reduce<Record<string, string>>((map, param) => {
      map[param.key] = param.value;
      return map;
    }, {});
  },

  /**
   * Validate parameter value based on type
   *
   * @param value - Value to validate
   * @param type - Parameter type
   * @returns True if valid
   */
  isValidValue(value: string, type?: string): boolean {
    if (type === undefined || type === '') {
      return true;
    }

    switch (type) {
      case 'INTEGER':
        return /^-?\d+$/.test(value);
      case 'FLOAT':
        return /^-?\d+(\.\d+)?$/.test(value);
      case 'BOOLEAN':
        return value === 'true' || value === 'false';
      default:
        return true; // STRING and TEXT are always valid
    }
  },
};

/**
 * Pattern building utilities
 */
export const patternBuilder = {
  /**
   * Build a regex pattern for method calls
   *
   * @param objectName - Object name (e.g., 'console')
   * @param methodName - Method name (e.g., 'log')
   * @param flags - Regex flags
   * @returns Regex pattern string
   *
   * @example
   * ```typescript
   * const pattern = PatternBuilder.methodCallPattern('console', 'log');
   * // Returns: '\bconsole\s*\.\s*log\s*\('
   * ```
   */
  methodCallPattern(objectName: string, methodName?: string, _flags?: string): string {
    const escapedObject: string = objectName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

    if (methodName !== undefined && methodName !== '') {
      const escapedMethod: string = methodName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
      return String.raw`\b${escapedObject}\s*\.\s*${escapedMethod}\s*\(`;
    }

    return String.raw`\b${escapedObject}\s*\.\s*\w+\s*\(`;
  },

  /**
   * Build a pattern for string literals containing text
   *
   * @param text - Text to find in strings
   * @param quoteTypes - Types of quotes to match
   * @returns Regex pattern string
   */
  stringContainingPattern(
    text: string,
    quoteTypes: Array<'"' | "'" | '`'> = ['"', "'", '`'],
  ): string {
    const escapedText: string = text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const quotePatterns = quoteTypes.map((quote) => {
      if (quote === '`') {
        // Template literals can span multiple lines - use non-greedy matching
        return `${quote}[^${quote}]*?${escapedText}[^${quote}]*?${quote}`;
      }
      // Use non-greedy matching to prevent ReDoS
      return String.raw`${quote}[^${quote}\n]*?${escapedText}[^${quote}\n]*?${quote}`;
    });

    return `(${quotePatterns.join('|')})`;
  },

  /**
   * Build an XPath pattern for finding elements
   *
   * @param elementType - Type of element to find
   * @param attributeConditions - Attribute conditions
   * @returns XPath expression
   */
  xpathPattern(elementType: string, attributeConditions?: Record<string, string>): string {
    let xpath = `//${elementType}`;

    if (attributeConditions && Object.keys(attributeConditions).length > 0) {
      const conditions = Object.entries(attributeConditions)
        .map(([attr, value]) => `@${attr}="${value}"`)
        .join(' and ');
      xpath += `[${conditions}]`;
    }

    return xpath;
  },

  /**
   * Build a pattern for TODO/FIXME comments
   *
   * @param keywords - Keywords to match
   * @param caseSensitive - Whether to match case-sensitively
   * @returns Regex pattern string
   */
  todoCommentPattern(
    keywords: string[] = ['TODO', 'FIXME', 'HACK', 'XXX'],
    caseSensitive = false,
  ): string {
    const keywordPattern = keywords.join('|');
    const flags = caseSensitive ? '' : '(?i)';

    // Match single-line and multi-line comments
    // Use atomic groups to prevent ReDoS
    return String.raw`(\/\/.*?\b${flags}(${keywordPattern})\b.*)|(\/\*(?:[^*]|\*(?!\/))*?\b${flags}(${keywordPattern})\b(?:[^*]|\*(?!\/))*?\*\/)`;
  },
};

/**
 * Message template utilities
 */
export const messageTemplateUtils: {
  templates: {
    security: string;
    performance: string;
    maintainability: string;
    deprecated: string;
    naming: string;
    complexity: string;
  };
  format: (template: string, values: Record<string, string>) => string;
  getTemplate: (category: keyof typeof messageTemplateUtils.templates) => string | null;
} = {
  /**
   * Common message templates
   */
  templates: {
    security: 'Potential security vulnerability: {description}',
    performance: 'Performance issue: {description}',
    maintainability: 'Code maintainability issue: {description}',
    deprecated: 'Use of deprecated {element}: {suggestion}',
    naming: 'Naming convention violation: {expected}',
    complexity: 'Code complexity too high: {metric}',
  } as const,

  /**
   * Create a message with placeholders
   *
   * @param template - Message template
   * @param values - Placeholder values
   * @returns Formatted message
   *
   * @example
   * ```typescript
   * const msg = messageTemplateUtils.format(
   *   'Found {count} issues in {file}',
   *   { count: '3', file: 'app.js' }
   * );
   * // Returns: 'Found 3 issues in app.js'
   * ```
   */
  format(template: string, values: Record<string, string>): string {
    return template.replaceAll(/{(\w+)}/g, (match, key: string) => values[key] ?? match);
  },

  /**
   * Get a predefined template
   *
   * @param category - Template category
   * @returns Template string or null
   */
  getTemplate(category: keyof typeof messageTemplateUtils.templates): string | null {
    // The templates object has all keys defined, so we need to check if it's a valid category
    if (category in messageTemplateUtils.templates) {
      return messageTemplateUtils.templates[category];
    }
    return null;
  },
};

/**
 * Rule migration utilities
 */
export const ruleMigrationUtils = {
  /**
   * Convert v1 custom rule format to v2 format
   *
   * @param v1Rule - V1 format rule
   * @returns V2 format rule request
   */
  migrateFromV1(
    v1Rule: {
      key?: string;
      customKey?: string;
      templateKey?: string;
      templateKeyAlias?: string;
      name: string;
      markdownDescription?: string;
      htmlDesc?: string;
      description?: string;
      status?: string;
      params?: unknown;
      parameters?: unknown;
    } & Record<string, unknown>,
  ): CreateCustomRuleV2Request {
    return {
      key: ruleMigrationUtils.extractRuleKey(v1Rule),
      templateKey: ruleMigrationUtils.extractTemplateKey(v1Rule),
      name: v1Rule.name,
      markdownDescription: ruleMigrationUtils.extractDescription(v1Rule),
      status: ruleMigrationUtils.mapV1Status(v1Rule.status),
      parameters: ruleMigrationUtils.mapV1Parameters(v1Rule.params ?? v1Rule.parameters),
    };
  },

  /**
   * Extract rule key from v1 rule format
   */
  extractRuleKey(v1Rule: { key?: string; customKey?: string } & Record<string, unknown>): string {
    return v1Rule.key ?? v1Rule.customKey ?? (v1Rule['custom_key'] as string | undefined) ?? '';
  },

  /**
   * Extract template key from v1 rule format
   */
  extractTemplateKey(
    v1Rule: { templateKey?: string; templateKeyAlias?: string } & Record<string, unknown>,
  ): string {
    return (
      v1Rule.templateKey ??
      v1Rule.templateKeyAlias ??
      (v1Rule['template_key'] as string | undefined) ??
      ''
    );
  },

  /**
   * Extract description from v1 rule format
   */
  extractDescription(
    v1Rule: {
      markdownDescription?: string;
      htmlDesc?: string;
      description?: string;
    } & Record<string, unknown>,
  ): string {
    return (
      v1Rule.markdownDescription ??
      v1Rule.htmlDesc ??
      v1Rule.description ??
      (v1Rule['markdown_description'] as string | undefined) ??
      (v1Rule['html_desc'] as string | undefined) ??
      ''
    );
  },

  /**
   * Map v1 status to v2 status
   */
  mapV1Status(v1Status?: string): RuleStatus {
    const statusMap: Record<string, RuleStatus> = {
      ['READY']: 'READY',
      ['BETA']: 'BETA',
      ['DEPRECATED']: 'DEPRECATED',
      ['REMOVED']: 'REMOVED',
    };

    return statusMap[v1Status?.toUpperCase() ?? ''] ?? 'READY';
  },

  /**
   * Map v1 parameters to v2 format
   */
  mapV1Parameters(v1Params?: unknown): Array<{ key: string; value: string }> {
    if (v1Params === undefined || v1Params === null) {
      return [];
    }

    if (Array.isArray(v1Params)) {
      return v1Params
        .filter((p): p is { key: string; value: unknown } => {
          if (typeof p !== 'object' || p === null) {
            return false;
          }
          const obj = p as Record<string, unknown>;
          return 'key' in obj && typeof obj['key'] === 'string' && 'value' in obj;
        })
        .map((p) => {
          const obj = p as { key: string; value: unknown };
          const { key, value } = obj;
          let stringValue = '';
          if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
              stringValue = JSON.stringify(value);
            } else {
              // Safe to convert primitives to string
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              stringValue = String(value);
            }
          }
          return { key, value: stringValue };
        });
    }

    // Handle object format
    if (typeof v1Params === 'object') {
      return Object.entries(v1Params as Record<string, unknown>)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({ key, value: String(value) }));
    }

    return [];
  },

  /**
   * Export rules for backup/sharing
   *
   * @param rules - Rules to export
   * @param options - Export options
   * @returns Exported data
   */
  exportRules(
    rules: CreateCustomRuleV2Response[],
    options?: {
      includeMetadata?: boolean;
      format?: 'json' | 'yaml';
    },
  ): string {
    const exportData = rules.map((rule) => ruleMigrationUtils.mapRuleForExport(rule, options));

    if (options?.format === 'yaml') {
      return ruleMigrationUtils.formatAsYaml(exportData);
    }

    // Default to JSON
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Map a rule to export format
   */
  mapRuleForExport(
    rule: CreateCustomRuleV2Response,
    options?: { includeMetadata?: boolean },
  ): {
    key: string;
    templateKey?: string;
    name: string;
    markdownDescription?: string;
    status?: RuleStatus;
    parameters?: Array<{ key: string; value: string }>;
    metadata?: {
      createdAt?: string;
      updatedAt?: string;
      language?: string;
      tags?: string[];
      impacts?: Array<{ softwareQuality: SoftwareQuality; severity: ImpactSeverity }>;
    };
  } {
    const base = ruleMigrationUtils.buildBaseExportData(rule);

    if (options?.includeMetadata === true) {
      base.metadata = ruleMigrationUtils.buildMetadata(rule);
    }

    return base;
  },

  /**
   * Build base export data for a rule
   */
  buildBaseExportData(rule: CreateCustomRuleV2Response): {
    key: string;
    templateKey?: string;
    name: string;
    markdownDescription?: string;
    status?: RuleStatus;
    parameters?: Array<{ key: string; value: string }>;
    metadata?: {
      createdAt?: string;
      updatedAt?: string;
      language?: string;
      tags?: string[];
      impacts?: Array<{ softwareQuality: SoftwareQuality; severity: ImpactSeverity }>;
    };
  } {
    const base: {
      key: string;
      templateKey?: string;
      name: string;
      markdownDescription?: string;
      status?: RuleStatus;
      parameters?: Array<{ key: string; value: string }>;
      metadata?: {
        createdAt?: string;
        updatedAt?: string;
        language?: string;
        tags?: string[];
        impacts?: Array<{ softwareQuality: SoftwareQuality; severity: ImpactSeverity }>;
      };
    } = {
      key: rule.key,
      name: rule.name,
    };

    if (rule.templateKey !== undefined) {
      base.templateKey = rule.templateKey;
    }
    if (rule.markdownDescription !== undefined) {
      base.markdownDescription = rule.markdownDescription;
    }
    base.status = rule.status;
    if (rule.parameters !== undefined) {
      base.parameters = rule.parameters.map((p) => ({
        key: p.key,
        value: p.defaultValue ?? '',
      }));
    }

    return base;
  },

  /**
   * Build metadata for export
   */
  buildMetadata(rule: CreateCustomRuleV2Response): {
    createdAt?: string;
    updatedAt?: string;
    language?: string;
    tags?: string[];
    impacts?: Array<{ softwareQuality: SoftwareQuality; severity: ImpactSeverity }>;
  } {
    const metadata: {
      createdAt?: string;
      updatedAt?: string;
      language?: string;
      tags?: string[];
      impacts?: Array<{ softwareQuality: SoftwareQuality; severity: ImpactSeverity }>;
    } = {};

    if (rule.createdAt !== undefined) {
      metadata.createdAt = rule.createdAt;
    }
    if (rule.updatedAt !== undefined) {
      metadata.updatedAt = rule.updatedAt;
    }
    if (rule.language !== undefined) {
      metadata.language = rule.language;
    }
    if (rule.tags !== undefined) {
      metadata.tags = rule.tags;
    }
    metadata.impacts = rule.impacts;

    return metadata;
  },

  /**
   * Format rules as YAML
   */
  formatAsYaml(
    exportData: Array<{
      key: string;
      templateKey?: string;
      name: string;
      markdownDescription?: string;
      status?: RuleStatus;
      parameters?: Array<{ key: string; value: string }>;
    }>,
  ): string {
    return exportData
      .map((rule) => {
        const lines = [
          `- key: ${rule.key}`,
          `  templateKey: ${rule.templateKey ?? ''}`,
          `  name: ${rule.name}`,
          `  markdownDescription: |`,
        ];
        if (rule.markdownDescription && rule.markdownDescription !== '') {
          lines.push(...rule.markdownDescription.split('\n').map((l) => `    ${l}`));
        }
        lines.push(`  status: ${rule.status ?? 'READY'}`);
        if (rule.parameters && rule.parameters.length > 0) {
          lines.push(`  parameters:`);
          for (const p of rule.parameters) {
            lines.push(`    - key: ${p.key}`, `      value: "${p.value}"`);
          }
        }
        return lines.join('\n');
      })
      .join('\n\n');
  },
};

/**
 * Clean Code attribute mapping utilities
 */
export const cleanCodeAttributeUtils = {
  /**
   * Map legacy severity to clean code attributes
   */
  severityToAttribute: {
    info: 'CONVENTIONAL',
    minor: 'IDENTIFIABLE',
    major: 'LOGICAL',
    critical: 'TESTED',
    blocker: 'TRUSTWORTHY',
  } as const,

  /**
   * Map legacy type to software quality
   */
  typeToQuality: {
    codeSmell: 'MAINTAINABILITY',
    bug: 'RELIABILITY',
    vulnerability: 'SECURITY',
    securityHotspot: 'SECURITY',
  } as const,

  /**
   * Get suggested clean code attribute for legacy severity
   *
   * @param severity - Legacy severity
   * @returns Suggested clean code attribute
   */
  fromSeverity(severity: RuleSeverity): CleanCodeAttribute {
    const severityMap: Record<
      RuleSeverity,
      keyof typeof cleanCodeAttributeUtils.severityToAttribute
    > = {
      ['INFO']: 'info',
      ['MINOR']: 'minor',
      ['MAJOR']: 'major',
      ['CRITICAL']: 'critical',
      ['BLOCKER']: 'blocker',
    };
    const key = severityMap[severity];
    return cleanCodeAttributeUtils.severityToAttribute[key];
  },

  /**
   * Get software quality from legacy type
   *
   * @param type - Legacy issue type
   * @returns Software quality
   */
  qualityFromType(type: RuleType): SoftwareQuality {
    const typeMap: Record<RuleType, keyof typeof cleanCodeAttributeUtils.typeToQuality> = {
      ['CODE_SMELL']: 'codeSmell',
      ['BUG']: 'bug',
      ['VULNERABILITY']: 'vulnerability',
      ['SECURITY_HOTSPOT']: 'securityHotspot',
    };
    const key = typeMap[type];
    return cleanCodeAttributeUtils.typeToQuality[key];
  },

  /**
   * Map severity to impact severity
   *
   * @param severity - Legacy severity
   * @returns Impact severity
   */
  impactSeverityFromSeverity(severity: RuleSeverity): ImpactSeverity {
    switch (severity) {
      case 'INFO':
      case 'MINOR':
        return 'LOW';
      case 'MAJOR':
        return 'MEDIUM';
      case 'CRITICAL':
      case 'BLOCKER':
        return 'HIGH';
      default:
        return 'MEDIUM';
    }
  },
};
