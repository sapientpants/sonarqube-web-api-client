/**
 * Service for validating platform-specific configurations across v2 APIs
 * @since 10.3
 */

/**
 * Supported DevOps platforms
 */
export enum DevOpsPlatform {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
  AzureDevops = 'azure_devops',
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  platform?: DevOpsPlatform;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
  platform?: DevOpsPlatform;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Base platform configuration
 */
export interface PlatformConfig {
  platform: DevOpsPlatform;
  identifier?: string;
}

/**
 * GitHub-specific configuration
 */
export interface GitHubConfig {
  owner: string;
  repository: string;
  branch?: string;
}

/**
 * GitLab-specific configuration
 */
export interface GitLabConfig {
  namespace: string;
  project: string;
  branch?: string;
}

/**
 * Bitbucket-specific configuration
 */
export interface BitbucketConfig {
  workspace: string;
  repository: string;
  branch?: string;
}

/**
 * Azure DevOps-specific configuration
 */
export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  repository: string;
  branch?: string;
}

/**
 * Platform validation rules
 */
interface PlatformValidationRule {
  platform: DevOpsPlatform;
  requiredFields: string[];
  identifierFormat: RegExp;
  identifierExample: string;
}

/**
 * Service for validating platform-specific configurations
 * Provides unified validation logic across different v2 APIs
 */
export class PlatformValidationService {
  private static readonly VALIDATION_RULES: PlatformValidationRule[] = [
    {
      platform: DevOpsPlatform.GITHUB,
      requiredFields: ['owner', 'repository'],
      identifierFormat: /^[\w.-]+\/[\w.-]+$/,
      identifierExample: 'owner/repository',
    },
    {
      platform: DevOpsPlatform.GITLAB,
      requiredFields: ['namespace', 'project'],
      identifierFormat: /^[\w.-]+\/[\w.-]+$/,
      identifierExample: 'namespace/project',
    },
    {
      platform: DevOpsPlatform.BITBUCKET,
      requiredFields: ['workspace', 'repository'],
      identifierFormat: /^[\w.-]+\/[\w.-]+$/,
      identifierExample: 'workspace/repository',
    },
    {
      platform: DevOpsPlatform.AzureDevops,
      requiredFields: ['organization', 'project', 'repository'],
      identifierFormat: /^[\w.-]+\/[\w.-]+$/,
      identifierExample: 'organization/project',
    },
  ];

  /**
   * Validate platform configuration
   *
   * @param config - Platform configuration to validate
   * @param platformSpecific - Platform-specific configuration
   * @returns Validation result
   */
  static validate(
    config: PlatformConfig,
    platformSpecific?: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if platform is supported
    const rule = this.VALIDATION_RULES.find((r) => r.platform === config.platform);
    if (!rule) {
      errors.push({
        field: 'platform',
        message: `Unsupported DevOps platform: ${config.platform}`,
        code: 'UNSUPPORTED_PLATFORM',
      });
      return { valid: false, errors, warnings };
    }

    // Validate platform-specific fields
    if (platformSpecific) {
      this.validatePlatformSpecific(config.platform, platformSpecific, errors, warnings);
    }

    // Validate identifier format if provided
    if (config.identifier) {
      this.validateIdentifier(config.platform, config.identifier, platformSpecific, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate GitHub configuration
   *
   * @param config - GitHub configuration
   * @returns Validation result
   */
  static validateGitHub(config: GitHubConfig, identifier?: string): ValidationResult {
    return this.validate(
      { platform: DevOpsPlatform.GITHUB, identifier },
      config as unknown as Record<string, unknown>
    );
  }

  /**
   * Validate GitLab configuration
   *
   * @param config - GitLab configuration
   * @returns Validation result
   */
  static validateGitLab(config: GitLabConfig, identifier?: string): ValidationResult {
    return this.validate(
      { platform: DevOpsPlatform.GITLAB, identifier },
      config as unknown as Record<string, unknown>
    );
  }

  /**
   * Validate Bitbucket configuration
   *
   * @param config - Bitbucket configuration
   * @returns Validation result
   */
  static validateBitbucket(config: BitbucketConfig, identifier?: string): ValidationResult {
    return this.validate(
      { platform: DevOpsPlatform.BITBUCKET, identifier },
      config as unknown as Record<string, unknown>
    );
  }

  /**
   * Validate Azure DevOps configuration
   *
   * @param config - Azure DevOps configuration
   * @returns Validation result
   */
  static validateAzureDevOps(config: AzureDevOpsConfig, identifier?: string): ValidationResult {
    return this.validate(
      { platform: DevOpsPlatform.AzureDevops, identifier },
      config as unknown as Record<string, unknown>
    );
  }

  /**
   * Build identifier from platform-specific configuration
   *
   * @param platform - DevOps platform
   * @param config - Platform-specific configuration
   * @returns Suggested identifier
   */
  static buildIdentifier(
    platform: DevOpsPlatform,
    config: Record<string, unknown>
  ): string | undefined {
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        return config.owner !== undefined &&
          config.owner !== null &&
          config.repository !== undefined &&
          config.repository !== null
          ? `${String(config.owner)}/${String(config.repository)}`
          : undefined;

      case DevOpsPlatform.GITLAB:
        return config.namespace !== undefined &&
          config.namespace !== null &&
          config.project !== undefined &&
          config.project !== null
          ? `${String(config.namespace)}/${String(config.project)}`
          : undefined;

      case DevOpsPlatform.BITBUCKET:
        return config.workspace !== undefined &&
          config.workspace !== null &&
          config.repository !== undefined &&
          config.repository !== null
          ? `${String(config.workspace)}/${String(config.repository)}`
          : undefined;

      case DevOpsPlatform.AzureDevops:
        return config.organization !== undefined &&
          config.organization !== null &&
          config.project !== undefined &&
          config.project !== null
          ? `${String(config.organization)}/${String(config.project)}`
          : undefined;

      default:
        return undefined;
    }
  }

  /**
   * Validate platform-specific fields
   * @private
   */
  private static validatePlatformSpecific(
    platform: DevOpsPlatform,
    config: Record<string, unknown>,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const rule = this.VALIDATION_RULES.find((r) => r.platform === platform);
    if (!rule) {
      return;
    }

    // Check required fields
    for (const field of rule.requiredFields) {
      if (!config[field] || String(config[field]).trim() === '') {
        errors.push({
          field: `platformSpecific.${field}`,
          message: `${this.formatFieldName(field)} is required for ${platform}`,
          code: `MISSING_${platform.toUpperCase()}_${field.toUpperCase()}`,
          platform,
        });
      }
    }

    // Platform-specific validations
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        this.validateGitHubSpecific(config, warnings);
        break;
      case DevOpsPlatform.GITLAB:
        this.validateGitLabSpecific(config, warnings);
        break;
      case DevOpsPlatform.BITBUCKET:
        this.validateBitbucketSpecific(config, warnings);
        break;
      case DevOpsPlatform.AzureDevops:
        this.validateAzureDevOpsSpecific(config, warnings);
        break;
    }
  }

  /**
   * Validate identifier format
   * @private
   */
  private static validateIdentifier(
    platform: DevOpsPlatform,
    identifier: string,
    config: Record<string, unknown> | undefined,
    warnings: ValidationWarning[]
  ): void {
    const rule = this.VALIDATION_RULES.find((r) => r.platform === platform);
    if (!rule) {
      return;
    }

    if (!rule.identifierFormat.test(identifier)) {
      const suggestion = config ? this.buildIdentifier(platform, config) : undefined;
      warnings.push({
        field: 'identifier',
        message: `${platform} identifier should be in format "${rule.identifierExample}"`,
        suggestion,
        platform,
      });
    }
  }

  /**
   * GitHub-specific validations
   * @private
   */
  private static validateGitHubSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[]
  ): void {
    // Check for common GitHub naming issues
    if (config.owner && String(config.owner).includes(' ')) {
      warnings.push({
        field: 'platformSpecific.owner',
        message: 'GitHub owner should not contain spaces',
        platform: DevOpsPlatform.GITHUB,
      });
    }

    if (config.repository && String(config.repository).includes(' ')) {
      warnings.push({
        field: 'platformSpecific.repository',
        message: 'GitHub repository name should not contain spaces',
        platform: DevOpsPlatform.GITHUB,
      });
    }
  }

  /**
   * GitLab-specific validations
   * @private
   */
  private static validateGitLabSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[]
  ): void {
    // Check for common GitLab naming issues
    if (config.namespace && String(config.namespace).includes(' ')) {
      warnings.push({
        field: 'platformSpecific.namespace',
        message: 'GitLab namespace should not contain spaces',
        platform: DevOpsPlatform.GITLAB,
      });
    }
  }

  /**
   * Bitbucket-specific validations
   * @private
   */
  private static validateBitbucketSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[]
  ): void {
    // Check for common Bitbucket naming issues
    if (config.workspace && String(config.workspace).includes(' ')) {
      warnings.push({
        field: 'platformSpecific.workspace',
        message: 'Bitbucket workspace should not contain spaces',
        platform: DevOpsPlatform.BITBUCKET,
      });
    }
  }

  /**
   * Azure DevOps-specific validations
   * @private
   */
  private static validateAzureDevOpsSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[]
  ): void {
    // Check for common Azure DevOps naming issues
    if (config.organization && String(config.organization).includes(' ')) {
      warnings.push({
        field: 'platformSpecific.organization',
        message: 'Azure DevOps organization should not contain spaces',
        platform: DevOpsPlatform.AzureDevops,
      });
    }
  }

  /**
   * Format field name for user-friendly messages
   * @private
   */
  private static formatFieldName(field: string): string {
    return field
      .split(/(?=[A-Z])/)
      .join(' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  }
}
