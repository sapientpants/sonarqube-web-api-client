/**
 * Utility classes for DOP Translation API v2
 * Provides platform detection, validation, project mapping, and authentication helpers
 */

import {
  DevOpsPlatform,
  ProjectVisibility,
  type PlatformDetectionResult,
  type ExtractedPlatformInfo,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type GitHubConfig,
  type GitLabConfig,
  type BitbucketConfig,
  type AzureDevOpsConfig,
  type SonarQubeProjectConfig,
  type AuthenticationCredentials,
} from './types';

// ============================================================================
// Platform Detection Utility
// ============================================================================

/**
 * Utility class for detecting DevOps platforms from URLs and extracting project information
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PlatformDetector {
  /**
   * Detect DevOps platform from a repository URL
   * @param url - Repository URL to analyze
   * @returns Detection result with platform, confidence, and extracted info
   */
  static detectFromUrl(url: string): PlatformDetectionResult {
    const patterns = [
      {
        platform: DevOpsPlatform.GITHUB,
        pattern: /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/\s?#]+)/,
        confidence: 1.0,
        isEnterprise: false,
      },
      {
        platform: DevOpsPlatform.GITHUB,
        pattern: /(?:https?:\/\/)?([^/]+)\/([^/]+)\/([^/\s?#]+)/,
        confidence: 0.6,
        isEnterprise: true,
        enterpriseCheck: (hostname: string): boolean => {
          // Parse hostname to ensure proper domain validation
          const lowerHostname = hostname.toLowerCase();

          // Check for exact domain matches or subdomains
          const isGitLab =
            lowerHostname === 'gitlab.com' ||
            lowerHostname.endsWith('.gitlab.com') ||
            lowerHostname.includes('gitlab');
          const isBitbucket =
            lowerHostname === 'bitbucket.org' ||
            lowerHostname.endsWith('.bitbucket.org') ||
            lowerHostname.includes('bitbucket');
          const isAzure =
            lowerHostname === 'dev.azure.com' ||
            lowerHostname.endsWith('.azure.com') ||
            lowerHostname.includes('azure');
          const isPublicGitHub =
            lowerHostname === 'github.com' || lowerHostname === 'www.github.com';

          // This is GitHub Enterprise if it's not any other platform and not public GitHub
          return !isGitLab && !isBitbucket && !isAzure && !isPublicGitHub;
        },
      },
      {
        platform: DevOpsPlatform.GITLAB,
        pattern: /(?:https?:\/\/)?(?:www\.)?gitlab\.com\/([^/]+)\/([^/\s?#]+)/,
        confidence: 1.0,
        isEnterprise: false,
      },
      {
        platform: DevOpsPlatform.GITLAB,
        pattern: /(?:https?:\/\/)?([^/]+)\/([^/]+)\/([^/\s?#]+)/,
        confidence: 0.7,
        isEnterprise: true,
        enterpriseCheck: (hostname: string): boolean => hostname.includes('gitlab'),
      },
      {
        platform: DevOpsPlatform.BITBUCKET,
        pattern: /(?:https?:\/\/)?(?:www\.)?bitbucket\.org\/([^/]+)\/([^/\s?#]+)/,
        confidence: 1.0,
        isEnterprise: false,
      },
      {
        platform: DevOpsPlatform.AzureDevops,
        pattern: /(?:https?:\/\/)?dev\.azure\.com\/([^/]+)\/([^/]+)/,
        confidence: 1.0,
        isEnterprise: false,
      },
      {
        platform: DevOpsPlatform.AzureDevops,
        pattern: /(?:https?:\/\/)?([^/]+)\.visualstudio\.com\/([^/]+)/,
        confidence: 0.9,
        isEnterprise: true,
      },
    ];

    for (const { platform, pattern, confidence, isEnterprise, enterpriseCheck } of patterns) {
      const match = url.match(pattern);
      if (match && match.length >= 3) {
        let organization: string;
        let repository: string;
        let hostname = '';
        let apiUrl: string | undefined;

        if (isEnterprise && match.length >= 4) {
          hostname = match[1] ?? '';
          organization = match[2] ?? '';
          repository = match[3] ?? '';

          // Apply enterprise check if provided
          if (enterpriseCheck !== undefined && !enterpriseCheck(hostname)) {
            continue;
          }

          apiUrl = this.generateApiUrl(platform, hostname);
        } else {
          organization = match[1] ?? '';
          repository = match[2] ?? '';
          apiUrl = undefined;
        }

        // Skip if organization or repository is undefined
        if (!organization || !repository) {
          continue;
        }

        // Clean repository name (remove .git suffix if present)
        repository = repository.replace(/\.git$/, '');

        const extractedInfo: ExtractedPlatformInfo = {
          organization,
          repository,
          url,
          isEnterprise,
        };

        if (apiUrl !== undefined) {
          extractedInfo.apiUrl = apiUrl;
        }

        return {
          platform,
          confidence,
          extractedInfo,
        };
      }
    }

    // Default fallback (assume GitHub if no clear match)
    return {
      platform: DevOpsPlatform.GITHUB,
      confidence: 0.0,
      extractedInfo: { url },
    };
  }

  /**
   * Extract project information from a platform-specific URL
   * @param url - URL to parse
   * @param platform - Known platform type
   * @returns Extracted platform information
   */
  static extractProjectInfo(url: string, platform: DevOpsPlatform): ExtractedPlatformInfo {
    const detection = this.detectFromUrl(url);

    if (detection.platform === platform) {
      return detection.extractedInfo;
    }

    // Fallback to basic URL parsing
    return { url };
  }

  /**
   * Generate API URL for enterprise instances
   * @param platform - Platform type
   * @param hostname - Enterprise hostname
   * @returns API URL
   */
  private static generateApiUrl(platform: DevOpsPlatform, hostname: string): string {
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        return `https://${hostname}/api/v3`;
      case DevOpsPlatform.GITLAB:
        return `https://${hostname}/api/v4`;
      case DevOpsPlatform.BITBUCKET:
        return `https://${hostname}/rest/api/1.0`;
      case DevOpsPlatform.AzureDevops:
        return `https://${hostname}/_apis`;
      default:
        return '';
    }
  }
}

// ============================================================================
// Configuration Validator Utility
// ============================================================================

/**
 * Utility class for validating platform-specific configurations
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConfigurationValidator {
  /**
   * Validate GitHub configuration
   * @param config - GitHub configuration to validate
   * @returns Validation result
   */
  static validateGitHubConfig(config: GitHubConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config.owner) {
      errors.push({
        field: 'owner',
        message: 'GitHub owner/organization is required',
        code: 'MISSING_GITHUB_OWNER',
        platform: DevOpsPlatform.GITHUB,
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'repository',
        message: 'GitHub repository name is required',
        code: 'MISSING_GITHUB_REPO',
        platform: DevOpsPlatform.GITHUB,
      });
    }

    // Validate naming conventions
    if (config.owner && !/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/.test(config.owner)) {
      warnings.push({
        field: 'owner',
        message: 'GitHub owner name should follow naming conventions',
        suggestion: 'Use alphanumeric characters and hyphens only, cannot start or end with hyphen',
        platform: DevOpsPlatform.GITHUB,
      });
    }

    if (config.repository && !/^[a-zA-Z0-9._-]+$/.test(config.repository)) {
      warnings.push({
        field: 'repository',
        message: 'GitHub repository name should follow naming conventions',
        suggestion: 'Use alphanumeric characters, dots, underscores, and hyphens only',
        platform: DevOpsPlatform.GITHUB,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate GitLab configuration
   * @param config - GitLab configuration to validate
   * @returns Validation result
   */
  static validateGitLabConfig(config: GitLabConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config.namespace) {
      errors.push({
        field: 'namespace',
        message: 'GitLab namespace is required',
        code: 'MISSING_GITLAB_NAMESPACE',
        platform: DevOpsPlatform.GITLAB,
      });
    }

    if (!config.project) {
      errors.push({
        field: 'project',
        message: 'GitLab project name is required',
        code: 'MISSING_GITLAB_PROJECT',
        platform: DevOpsPlatform.GITLAB,
      });
    }

    // Validate GitLab naming conventions
    if (config.namespace && !/^[a-zA-Z0-9._-]+$/.test(config.namespace)) {
      warnings.push({
        field: 'namespace',
        message: 'GitLab namespace should follow naming conventions',
        suggestion: 'Use alphanumeric characters, dots, underscores, and hyphens only',
        platform: DevOpsPlatform.GITLAB,
      });
    }

    if (config.project && !/^[a-zA-Z0-9._-]+$/.test(config.project)) {
      warnings.push({
        field: 'project',
        message: 'GitLab project name should follow naming conventions',
        suggestion: 'Use alphanumeric characters, dots, underscores, and hyphens only',
        platform: DevOpsPlatform.GITLAB,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Bitbucket configuration
   * @param config - Bitbucket configuration to validate
   * @returns Validation result
   */
  static validateBitbucketConfig(config: BitbucketConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config.workspace) {
      errors.push({
        field: 'workspace',
        message: 'Bitbucket workspace is required',
        code: 'MISSING_BITBUCKET_WORKSPACE',
        platform: DevOpsPlatform.BITBUCKET,
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'repository',
        message: 'Bitbucket repository name is required',
        code: 'MISSING_BITBUCKET_REPO',
        platform: DevOpsPlatform.BITBUCKET,
      });
    }

    // Validate Bitbucket naming conventions
    if (config.workspace && !/^[a-zA-Z0-9_-]+$/.test(config.workspace)) {
      warnings.push({
        field: 'workspace',
        message: 'Bitbucket workspace should follow naming conventions',
        suggestion: 'Use alphanumeric characters, underscores, and hyphens only',
        platform: DevOpsPlatform.BITBUCKET,
      });
    }

    if (config.repository && !/^[a-zA-Z0-9._-]+$/.test(config.repository)) {
      warnings.push({
        field: 'repository',
        message: 'Bitbucket repository name should follow naming conventions',
        suggestion: 'Use alphanumeric characters, dots, underscores, and hyphens only',
        platform: DevOpsPlatform.BITBUCKET,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Azure DevOps configuration
   * @param config - Azure DevOps configuration to validate
   * @returns Validation result
   */
  static validateAzureDevOpsConfig(config: AzureDevOpsConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config.organization) {
      errors.push({
        field: 'organization',
        message: 'Azure DevOps organization is required',
        code: 'MISSING_AZURE_ORG',
        platform: DevOpsPlatform.AzureDevops,
      });
    }

    if (!config.project) {
      errors.push({
        field: 'project',
        message: 'Azure DevOps project is required',
        code: 'MISSING_AZURE_PROJECT',
        platform: DevOpsPlatform.AzureDevops,
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'repository',
        message: 'Azure DevOps repository is required',
        code: 'MISSING_AZURE_REPO',
        platform: DevOpsPlatform.AzureDevops,
      });
    }

    // Azure DevOps has more restrictive naming conventions
    if (config.organization && !/^[a-zA-Z0-9-]+$/.test(config.organization)) {
      warnings.push({
        field: 'organization',
        message: 'Azure DevOps organization should follow naming conventions',
        suggestion: 'Use alphanumeric characters and hyphens only',
        platform: DevOpsPlatform.AzureDevops,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

// ============================================================================
// Project Mapper Utility
// ============================================================================

/**
 * Utility class for mapping external project structures to SonarQube format
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ProjectMapper {
  /**
   * Map GitHub project to SonarQube project configuration
   * @param githubProject - GitHub project object from API
   * @returns Partial SonarQube project configuration
   */
  static mapGitHubProject(githubProject: Record<string, unknown>): Partial<SonarQubeProjectConfig> {
    const owner = githubProject['owner'] as Record<string, unknown> | undefined;
    const ownerLogin = owner?.['login'] as string | undefined;
    const name = githubProject['name'] as string | undefined;
    const description = githubProject['description'] as string | null | undefined;
    const isPrivate = githubProject['private'] as boolean | undefined;
    const topics = githubProject['topics'] as string[] | undefined;

    const result: Partial<SonarQubeProjectConfig> = {
      visibility: isPrivate === true ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC,
      tags: topics ?? [],
    };

    if (ownerLogin !== undefined && name !== undefined) {
      result.key = `${ownerLogin}_${name}`;
    }
    if (name !== undefined) {
      result.name = name;
    }
    if (description !== undefined && description !== null) {
      result.description = description;
    }

    return result;
  }

  /**
   * Map GitLab project to SonarQube project configuration
   * @param gitlabProject - GitLab project object from API
   * @returns Partial SonarQube project configuration
   */
  static mapGitLabProject(gitlabProject: Record<string, unknown>): Partial<SonarQubeProjectConfig> {
    const pathWithNamespace = gitlabProject['path_with_namespace'] as string | undefined;
    const name = gitlabProject['name'] as string | undefined;
    const description = gitlabProject['description'] as string | null | undefined;
    const visibility = gitlabProject['visibility'] as string | undefined;
    const tagList = gitlabProject['tag_list'] as string[] | undefined;

    const result: Partial<SonarQubeProjectConfig> = {
      visibility: visibility === 'private' ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC,
      tags: tagList ?? [],
    };

    if (pathWithNamespace !== undefined) {
      result.key = pathWithNamespace.replace(/\//g, '_');
    }
    if (name !== undefined) {
      result.name = name;
    }
    if (description !== undefined && description !== null) {
      result.description = description;
    }

    return result;
  }

  /**
   * Map Bitbucket project to SonarQube project configuration
   * @param bitbucketProject - Bitbucket repository object from API
   * @returns Partial SonarQube project configuration
   */
  static mapBitbucketProject(
    bitbucketProject: Record<string, unknown>
  ): Partial<SonarQubeProjectConfig> {
    const workspace = bitbucketProject['workspace'] as Record<string, unknown> | undefined;
    const workspaceSlug = workspace?.['slug'] as string | undefined;
    const slug = bitbucketProject['slug'] as string | undefined;
    const name = bitbucketProject['name'] as string | undefined;
    const description = bitbucketProject['description'] as string | null | undefined;
    const isPrivate = bitbucketProject['is_private'] as boolean | undefined;

    const result: Partial<SonarQubeProjectConfig> = {
      visibility: isPrivate === true ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC,
      tags: [],
    };

    if (workspaceSlug !== undefined && slug !== undefined) {
      result.key = `${workspaceSlug}_${slug}`;
    }
    if (name !== undefined) {
      result.name = name;
    }
    if (description !== undefined && description !== null) {
      result.description = description;
    }

    return result;
  }

  /**
   * Map Azure DevOps project to SonarQube project configuration
   * @param azureProject - Azure DevOps project/repository object from API
   * @returns Partial SonarQube project configuration
   */
  static mapAzureDevOpsProject(
    azureProject: Record<string, unknown>
  ): Partial<SonarQubeProjectConfig> {
    const organization = azureProject['organization'] as string | undefined;
    const name = azureProject['name'] as string | undefined;
    const description = azureProject['description'] as string | null | undefined;
    const visibility = azureProject['visibility'] as string | undefined;

    const result: Partial<SonarQubeProjectConfig> = {
      visibility: visibility === 'private' ? ProjectVisibility.PRIVATE : ProjectVisibility.PUBLIC,
      tags: [],
    };

    if (organization !== undefined && name !== undefined) {
      result.key = `${organization}_${name}`;
    }
    if (name !== undefined) {
      result.name = name;
    }
    if (description !== undefined && description !== null) {
      result.description = description;
    }

    return result;
  }

  /**
   * Generate SonarQube project key from platform configuration
   * @param platform - DevOps platform
   * @param organization - Organization/namespace
   * @param repository - Repository name
   * @returns Generated project key
   */
  static generateProjectKey(
    platform: DevOpsPlatform,
    organization: string,
    repository: string
  ): string {
    const prefix = platform.toLowerCase().replace('-', '_');
    const cleanOrg = organization.replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanRepo = repository.replace(/[^a-zA-Z0-9_]/g, '_');
    return `${prefix}_${cleanOrg}_${cleanRepo}`;
  }
}

// ============================================================================
// Authentication Helper Utility
// ============================================================================

/**
 * Utility class for managing platform-specific authentication
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthenticationHelper {
  /**
   * Validate GitHub authentication credentials
   * @param config - GitHub configuration
   * @param credentials - Authentication credentials
   * @returns Promise resolving to validation status
   */
  static validateGitHubAuth(
    _config: GitHubConfig,
    credentials: AuthenticationCredentials
  ): boolean {
    // This would typically make an API call to validate credentials
    // For now, we'll do basic validation
    // Note: config parameter is available for future platform-specific validation

    switch (credentials.type) {
      case 'personal_access_token':
        return credentials.token.startsWith('ghp_');
      case 'oauth':
        return Boolean(credentials.clientId && credentials.clientSecret);
      case 'installation_token':
        return Boolean(credentials.installationId && credentials.appId && credentials.privateKey);
      case 'app_password':
        // GitHub doesn't use app passwords
        return false;
    }
  }

  /**
   * Validate GitLab authentication credentials
   * @param config - GitLab configuration
   * @param credentials - Authentication credentials
   * @returns Promise resolving to validation status
   */
  static validateGitLabAuth(
    _config: GitLabConfig,
    credentials: AuthenticationCredentials
  ): boolean {
    // Note: config parameter is available for future platform-specific validation

    switch (credentials.type) {
      case 'personal_access_token':
        return Boolean(credentials.token && credentials.token.length >= 20);
      case 'oauth':
        return Boolean(credentials.clientId && credentials.clientSecret);
      case 'app_password':
        // GitLab doesn't use app passwords
        return false;
      case 'installation_token':
        // GitLab doesn't use installation tokens
        return false;
    }
  }

  /**
   * Validate Bitbucket authentication credentials
   * @param config - Bitbucket configuration
   * @param credentials - Authentication credentials
   * @returns Promise resolving to validation status
   */
  static validateBitbucketAuth(
    _config: BitbucketConfig,
    credentials: AuthenticationCredentials
  ): boolean {
    // Note: config parameter is available for future platform-specific validation

    switch (credentials.type) {
      case 'app_password':
        return Boolean(credentials.username && credentials.password);
      case 'oauth':
        return Boolean(credentials.clientId && credentials.clientSecret);
      case 'personal_access_token':
        // Bitbucket doesn't use personal access tokens in the same way
        return false;
      case 'installation_token':
        // Bitbucket doesn't use installation tokens
        return false;
    }
  }

  /**
   * Validate Azure DevOps authentication credentials
   * @param config - Azure DevOps configuration
   * @param credentials - Authentication credentials
   * @returns Promise resolving to validation status
   */
  static validateAzureDevOpsAuth(
    _config: AzureDevOpsConfig,
    credentials: AuthenticationCredentials
  ): boolean {
    // Note: config parameter is available for future platform-specific validation

    switch (credentials.type) {
      case 'personal_access_token':
        return Boolean(credentials.token && credentials.token.length >= 52);
      case 'oauth':
        // Azure DevOps supports OAuth but typically uses PATs
        return Boolean(credentials.clientId && credentials.clientSecret);
      case 'app_password':
        // Azure DevOps doesn't use app passwords
        return false;
      case 'installation_token':
        // Azure DevOps doesn't use installation tokens
        return false;
    }
  }

  /**
   * Get required scopes for a platform
   * @param platform - DevOps platform
   * @param operations - Required operations
   * @returns Array of required scopes
   */
  static getRequiredScopes(platform: DevOpsPlatform, operations: string[]): string[] {
    const scopeMap: Record<DevOpsPlatform, Record<string, string[]>> = {
      [DevOpsPlatform.GITHUB]: {
        read: ['repo:status', 'public_repo'],
        write: ['repo'],
        admin: ['repo', 'admin:repo_hook'],
      },
      [DevOpsPlatform.GITLAB]: {
        read: ['read_repository'],
        write: ['write_repository'],
        admin: ['api'],
      },
      [DevOpsPlatform.BITBUCKET]: {
        read: ['repositories:read'],
        write: ['repositories:write'],
        admin: ['repositories:admin'],
      },
      [DevOpsPlatform.AzureDevops]: {
        read: ['vso.code'],
        write: ['vso.code_write'],
        admin: ['vso.code_manage'],
      },
    };

    const platformScopes = scopeMap[platform];

    const requiredScopes: string[] = [];
    for (const operation of operations) {
      const scopes = platformScopes[operation];
      if (scopes !== undefined) {
        requiredScopes.push(...scopes);
      }
    }

    return Array.from(new Set(requiredScopes));
  }
}

// ============================================================================
// Template Configuration Utility
// ============================================================================

/**
 * Utility class for managing configuration templates
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConfigurationTemplates {
  /**
   * Get default configuration for a platform
   * @param platform - DevOps platform
   * @param organization - Organization/namespace
   * @param repository - Repository name
   * @returns Default platform configuration
   */
  static getDefaultConfig(
    platform: DevOpsPlatform,
    organization: string,
    repository: string
  ): GitHubConfig | GitLabConfig | BitbucketConfig | AzureDevOpsConfig {
    switch (platform) {
      case DevOpsPlatform.GITHUB:
        return {
          owner: organization,
          repository,
          branch: 'main',
        };

      case DevOpsPlatform.GITLAB:
        return {
          namespace: organization,
          project: repository,
          branch: 'main',
        };

      case DevOpsPlatform.BITBUCKET:
        return {
          workspace: organization,
          repository,
          branch: 'main',
        };

      case DevOpsPlatform.AzureDevops:
        return {
          organization,
          project: organization,
          repository,
          branch: 'main',
        };

      default: {
        // This should never happen due to exhaustive switch, but TypeScript needs it
        const _exhaustiveCheck: never = platform;
        throw new Error(`Unsupported platform: ${_exhaustiveCheck as string}`);
      }
    }
  }

  /**
   * Get common SonarQube project configuration templates
   * @param type - Template type
   * @returns Partial SonarQube project configuration
   */
  static getSonarQubeTemplate(
    type: 'minimal' | 'standard' | 'enterprise'
  ): Partial<SonarQubeProjectConfig> {
    const templates = {
      minimal: {
        visibility: ProjectVisibility.PRIVATE,
      },
      standard: {
        visibility: ProjectVisibility.PRIVATE,
        qualityGate: 'Sonar way',
        tags: ['automated'],
      },
      enterprise: {
        visibility: ProjectVisibility.PRIVATE,
        qualityGate: 'Enterprise Quality Gate',
        tags: ['automated', 'enterprise'],
        settings: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'sonar.exclusions': '**/vendor/**,**/node_modules/**',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'sonar.coverage.exclusions': '**/*test*/**,**/*spec*/**',
        },
      },
    };

    return templates[type];
  }
}
