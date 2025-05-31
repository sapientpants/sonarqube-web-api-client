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
} from './types';

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
    let key = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, ''); // Remove leading/trailing hyphens

    // Add prefix if provided
    if (prefix !== undefined && prefix !== '') {
      key = `${prefix}-${key}`;
    }

    // Ensure it starts with a letter
    if (key === '' || !/^[a-z]/.test(key)) {
      key = `rule-${key}`;
    }

    // Truncate if too long (max 200 chars is a safe limit)
    if (key.length > 200) {
      key = key.substring(0, 200).replace(/-+$/, '');
    }

    return key;
  },

  /**
   * Validate a rule key format
   *
   * @param key - Rule key to validate
   * @returns True if valid, false otherwise
   */
  isValidKey: (key: string): boolean => {
    // Must start with letter, contain only letters, numbers, underscores, hyphens
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key) && key.length <= 200;
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
 * Template utilities for working with rule templates
 */
export const templateUtils = {
  /**
   * Common template patterns by language
   */
  commonTemplates: {
    javascript: [
      'javascript:CommentRegularExpression',
      'javascript:S124', // Comment pattern
      'javascript:XPath', // XPath rule
    ],
    java: [
      'java:S124', // Comment pattern
      'java:S3457', // Printf-style format string
      'java:XPath', // XPath rule
    ],
    python: [
      'python:CommentRegularExpression',
      'python:S124', // Comment pattern
      'python:XPath', // XPath rule
    ],
    csharp: [
      'csharpsquid:S124', // Comment pattern
      'csharpsquid:XPath', // XPath rule
    ],
    typescript: [
      'typescript:S124', // Comment pattern
      'typescript:XPath', // XPath rule
    ],
  } as const,

  /**
   * Get suggested templates for a language
   *
   * @param language - Programming language
   * @returns Array of suggested template keys
   */
  getSuggestedTemplates(language: string): string[] {
    const normalizedLang = language.toLowerCase();
    const templates = templateUtils.commonTemplates as unknown as Record<string, string[]>;
    return templates[normalizedLang] ?? [];
  },

  /**
   * Check if a template key is likely customizable
   *
   * @param templateKey - Template key to check
   * @returns True if likely customizable
   */
  isCustomizable(templateKey: string): boolean {
    const customizablePatterns = [
      /comment/i,
      /regex/i,
      /xpath/i,
      /pattern/i,
      /S124/, // Comment pattern rule
    ];

    return customizablePatterns.some((pattern) => pattern.test(templateKey));
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
    const escapedObject = objectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (methodName !== undefined && methodName !== '') {
      const escapedMethod = methodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `\\b${escapedObject}\\s*\\.\\s*${escapedMethod}\\s*\\(`;
    }

    return `\\b${escapedObject}\\s*\\.\\s*\\w+\\s*\\(`;
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
    quoteTypes: Array<'"' | "'" | '`'> = ['"', "'", '`']
  ): string {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const quotePatterns = quoteTypes.map((quote) => {
      if (quote === '`') {
        // Template literals can span multiple lines
        return `${quote}[^${quote}]*${escapedText}[^${quote}]*${quote}`;
      }
      return `${quote}[^${quote}\\n]*${escapedText}[^${quote}\\n]*${quote}`;
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
    _caseSensitive = false
  ): string {
    // Note: caseSensitive flag is not currently used in the pattern
    const keywordPattern = keywords.join('|');

    // Match single-line and multi-line comments
    return `(\\/\\/.*\\b(${keywordPattern})\\b.*)|(\\/\\*[\\s\\S]*?\\b(${keywordPattern})\\b[\\s\\S]*?\\*\\/)`;
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
    return template.replace(/{(\w+)}/g, (match, key: string) => values[key] ?? match);
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
    } & Record<string, unknown>
  ): CreateCustomRuleV2Request {
    // Map common v1 fields to v2 format
    return {
      key: v1Rule.key ?? v1Rule.customKey ?? (v1Rule['custom_key'] as string | undefined) ?? '',
      templateKey:
        v1Rule.templateKey ??
        v1Rule.templateKeyAlias ??
        (v1Rule['template_key'] as string | undefined) ??
        '',
      name: v1Rule.name,
      markdownDescription:
        v1Rule.markdownDescription ??
        v1Rule.htmlDesc ??
        v1Rule.description ??
        (v1Rule['markdown_description'] as string | undefined) ??
        (v1Rule['html_desc'] as string | undefined) ??
        '',
      status: ruleMigrationUtils.mapV1Status(v1Rule.status),
      parameters: ruleMigrationUtils.mapV1Parameters(v1Rule.params ?? v1Rule.parameters),
    };
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
    }
  ): string {
    const exportData = rules.map((rule) => {
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

      if (options?.includeMetadata === true) {
        base.metadata = {};
        if (rule.createdAt !== undefined) {
          base.metadata.createdAt = rule.createdAt;
        }
        if (rule.updatedAt !== undefined) {
          base.metadata.updatedAt = rule.updatedAt;
        }
        if (rule.language !== undefined) {
          base.metadata.language = rule.language;
        }
        if (rule.tags !== undefined) {
          base.metadata.tags = rule.tags;
        }
        base.metadata.impacts = rule.impacts;
      }

      return base;
    });

    if (options?.format === 'yaml') {
      // Simple YAML-like format (for demonstration)
      return exportData
        .map((rule) => {
          const lines = [`- key: ${rule.key}`];
          lines.push(`  templateKey: ${rule.templateKey ?? ''}`);
          lines.push(`  name: ${rule.name}`);
          lines.push(`  markdownDescription: |`);
          if (rule.markdownDescription !== undefined && rule.markdownDescription !== '') {
            lines.push(...rule.markdownDescription.split('\n').map((l) => `    ${l}`));
          }
          lines.push(`  status: ${rule.status ?? 'READY'}`);
          if (rule.parameters && rule.parameters.length > 0) {
            lines.push(`  parameters:`);
            rule.parameters.forEach((p) => {
              lines.push(`    - key: ${p.key}`);
              lines.push(`      value: "${p.value}"`);
            });
          }
          return lines.join('\n');
        })
        .join('\n\n');
    }

    // Default to JSON
    return JSON.stringify(exportData, null, 2);
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
