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
// Using namespace instead of class to avoid ESLint no-extraneous-class error
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PlatformValidationService {
  const validationRules: PlatformValidationRule[] = [
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
  export function validate(
    config: PlatformConfig,
    platformSpecific?: Record<string, unknown>,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if platform is supported
    const rule = validationRules.find((r) => r.platform === config.platform);
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
      validatePlatformSpecific(config.platform, platformSpecific, errors, warnings);
    }

    // Validate identifier format if provided
    if (config.identifier !== undefined) {
      validateIdentifier(config.platform, config.identifier, platformSpecific, warnings);
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
  export function validateGitHub(config: GitHubConfig, identifier?: string): ValidationResult {
    return validate(
      identifier !== undefined
        ? { platform: DevOpsPlatform.GITHUB, identifier }
        : { platform: DevOpsPlatform.GITHUB },
      config as unknown as Record<string, unknown>,
    );
  }

  /**
   * Validate GitLab configuration
   *
   * @param config - GitLab configuration
   * @returns Validation result
   */
  export function validateGitLab(config: GitLabConfig, identifier?: string): ValidationResult {
    return validate(
      identifier !== undefined
        ? { platform: DevOpsPlatform.GITLAB, identifier }
        : { platform: DevOpsPlatform.GITLAB },
      config as unknown as Record<string, unknown>,
    );
  }

  /**
   * Validate Bitbucket configuration
   *
   * @param config - Bitbucket configuration
   * @returns Validation result
   */
  export function validateBitbucket(
    config: BitbucketConfig,
    identifier?: string,
  ): ValidationResult {
    return validate(
      identifier !== undefined
        ? { platform: DevOpsPlatform.BITBUCKET, identifier }
        : { platform: DevOpsPlatform.BITBUCKET },
      config as unknown as Record<string, unknown>,
    );
  }

  /**
   * Validate Azure DevOps configuration
   *
   * @param config - Azure DevOps configuration
   * @returns Validation result
   */
  export function validateAzureDevOps(
    config: AzureDevOpsConfig,
    identifier?: string,
  ): ValidationResult {
    return validate(
      identifier !== undefined
        ? { platform: DevOpsPlatform.AzureDevops, identifier }
        : { platform: DevOpsPlatform.AzureDevops },
      config as unknown as Record<string, unknown>,
    );
  }

  /**
   * Build identifier from platform-specific configuration
   *
   * @param platform - DevOps platform
   * @param config - Platform-specific configuration
   * @returns Suggested identifier
   */
  export function buildIdentifier(
    platform: DevOpsPlatform,
    config: Record<string, unknown>,
  ): string | undefined {
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        return config['owner'] !== undefined &&
          config['owner'] !== null &&
          config['repository'] !== undefined &&
          config['repository'] !== null
          ? `${String(config['owner'] as string | number)}/${String(config['repository'] as string | number)}`
          : undefined;

      case DevOpsPlatform.GITLAB:
        return config['namespace'] !== undefined &&
          config['namespace'] !== null &&
          config['project'] !== undefined &&
          config['project'] !== null
          ? `${String(config['namespace'] as string | number)}/${String(config['project'] as string | number)}`
          : undefined;

      case DevOpsPlatform.BITBUCKET:
        return config['workspace'] !== undefined &&
          config['workspace'] !== null &&
          config['repository'] !== undefined &&
          config['repository'] !== null
          ? `${String(config['workspace'] as string | number)}/${String(config['repository'] as string | number)}`
          : undefined;

      case DevOpsPlatform.AzureDevops:
        return config['organization'] !== undefined &&
          config['organization'] !== null &&
          config['project'] !== undefined &&
          config['project'] !== null
          ? `${String(config['organization'] as string | number)}/${String(config['project'] as string | number)}`
          : undefined;

      default:
        return undefined;
    }
  }

  /**
   * Validate platform-specific fields
   * @private
   */
  function validatePlatformSpecific(
    platform: DevOpsPlatform,
    config: Record<string, unknown>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const rule = validationRules.find((r) => r.platform === platform);
    if (!rule) {
      return;
    }

    // Check required fields
    for (const field of rule.requiredFields) {
      const fieldValue = config[field];
      if (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (typeof fieldValue === 'string' && fieldValue.trim() === '')
      ) {
        errors.push({
          field: `platformSpecific.${field}`,
          message: `${formatFieldName(field)} is required for ${platform}`,
          code: `MISSING_${platform.toUpperCase()}_${field.toUpperCase().replace(/-/g, '_')}`,
          platform,
        });
      }
    }

    // Platform-specific validations
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        validateGitHubSpecific(config, warnings);
        break;
      case DevOpsPlatform.GITLAB:
        validateGitLabSpecific(config, warnings);
        break;
      case DevOpsPlatform.BITBUCKET:
        validateBitbucketSpecific(config, warnings);
        break;
      case DevOpsPlatform.AzureDevops:
        validateAzureDevOpsSpecific(config, warnings);
        break;
    }
  }

  /**
   * Validate identifier format
   * @private
   */
  function validateIdentifier(
    platform: DevOpsPlatform,
    identifier: string,
    config: Record<string, unknown> | undefined,
    warnings: ValidationWarning[],
  ): void {
    const rule = validationRules.find((r) => r.platform === platform);
    if (!rule) {
      return;
    }

    if (!rule.identifierFormat.test(identifier)) {
      const suggestion = config ? buildIdentifier(platform, config) : undefined;
      warnings.push({
        field: 'identifier',
        message: `${platform} identifier should be in format "${rule.identifierExample}"`,
        ...(suggestion !== undefined ? { suggestion } : {}),
        platform,
      });
    }
  }

  /**
   * GitHub-specific validations
   * @private
   */
  function validateGitHubSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[],
  ): void {
    // Check for common GitHub naming issues
    if (config['owner'] !== undefined && config['owner'] !== null) {
      const ownerStr = String(config['owner'] as string | number);
      if (ownerStr.includes(' ')) {
        warnings.push({
          field: 'platformSpecific.owner',
          message: 'GitHub owner should not contain spaces',
          platform: DevOpsPlatform.GITHUB,
        });
      }
    }

    if (config['repository'] !== undefined && config['repository'] !== null) {
      const repoStr = String(config['repository'] as string | number);
      if (repoStr.includes(' ')) {
        warnings.push({
          field: 'platformSpecific.repository',
          message: 'GitHub repository name should not contain spaces',
          platform: DevOpsPlatform.GITHUB,
        });
      }
    }
  }

  /**
   * GitLab-specific validations
   * @private
   */
  function validateGitLabSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[],
  ): void {
    // Check for common GitLab naming issues
    if (config['namespace'] !== undefined && config['namespace'] !== null) {
      const namespaceStr = String(config['namespace'] as string | number);
      if (namespaceStr.includes(' ')) {
        warnings.push({
          field: 'platformSpecific.namespace',
          message: 'GitLab namespace should not contain spaces',
          platform: DevOpsPlatform.GITLAB,
        });
      }
    }
  }

  /**
   * Bitbucket-specific validations
   * @private
   */
  function validateBitbucketSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[],
  ): void {
    // Check for common Bitbucket naming issues
    if (config['workspace'] !== undefined && config['workspace'] !== null) {
      const workspaceStr = String(config['workspace'] as string | number);
      if (workspaceStr.includes(' ')) {
        warnings.push({
          field: 'platformSpecific.workspace',
          message: 'Bitbucket workspace should not contain spaces',
          platform: DevOpsPlatform.BITBUCKET,
        });
      }
    }
  }

  /**
   * Azure DevOps-specific validations
   * @private
   */
  function validateAzureDevOpsSpecific(
    config: Record<string, unknown>,
    warnings: ValidationWarning[],
  ): void {
    // Check for common Azure DevOps naming issues
    if (config['organization'] !== undefined && config['organization'] !== null) {
      const orgStr = String(config['organization'] as string | number);
      if (orgStr.includes(' ')) {
        warnings.push({
          field: 'platformSpecific.organization',
          message: 'Azure DevOps organization should not contain spaces',
          platform: DevOpsPlatform.AzureDevops,
        });
      }
    }
  }

  /**
   * Format field name for user-friendly messages
   * @private
   */
  function formatFieldName(field: string): string {
    return field
      .split(/(?=[A-Z])/)
      .join(' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  }
}
