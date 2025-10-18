/**
 * Builder implementations for DOP Translation API v2
 * Provides fluent interfaces for creating bound projects
 */

import {
  DevOpsPlatform,
  type CreateBoundProjectV2Request,
  type CreateBoundProjectV2Response,
  type CreateBoundProjectV2Builder,
  type GitHubConfig,
  type GitLabConfig,
  type BitbucketConfig,
  type AzureDevOpsConfig,
  type SonarQubeProjectConfig,
  type ProjectVisibility,
  type ValidationResult,
  type ValidationError as DopValidationError,
  type ValidationWarning,
} from './types';

/**
 * Interface for clients that can create bound projects
 */
interface BoundProjectCreator {
  createBoundProjectV2: (
    request: CreateBoundProjectV2Request,
  ) => Promise<CreateBoundProjectV2Response>;
}

/**
 * Implementation of the CreateBoundProjectV2Builder interface
 * Provides a fluent API for configuring and creating bound projects
 */
export class CreateBoundProjectV2BuilderImpl implements CreateBoundProjectV2Builder {
  private readonly request: Partial<CreateBoundProjectV2Request> = {};

  constructor(private readonly client: BoundProjectCreator) {}

  /**
   * Set the DevOps platform for the project
   */
  forPlatform(platform: DevOpsPlatform): this {
    this.request.dopPlatform = platform;
    return this;
  }

  /**
   * Set the project identifier (e.g., "owner/repository")
   */
  withProjectIdentifier(identifier: string): this {
    this.request.projectIdentifier = identifier;

    // Auto-extract organization and repository if not set
    if (
      identifier.includes('/') &&
      this.request.organizationName === undefined &&
      this.request.repositoryName === undefined
    ) {
      const [org, repo] = identifier.split('/', 2);
      if (org !== undefined && org !== '' && repo !== undefined && repo !== '') {
        this.request.organizationName = org;
        this.request.repositoryName = repo;
      }
    }

    return this;
  }

  /**
   * Set the organization/namespace name
   */
  withOrganization(organization: string): this {
    this.request.organizationName = organization;
    this.updateProjectIdentifier();
    return this;
  }

  /**
   * Set the repository name
   */
  withRepository(repository: string): this {
    this.request.repositoryName = repository;
    this.updateProjectIdentifier();
    return this;
  }

  /**
   * Set the repository URL
   */
  withRepositoryUrl(url: string): this {
    this.request.repositoryUrl = url;
    return this;
  }

  /**
   * Set the main branch name
   */
  withMainBranch(branch: string): this {
    this.request.mainBranchName = branch;
    return this;
  }

  /**
   * Configure GitHub-specific settings
   */
  withGitHubConfig(config: Partial<GitHubConfig>): this {
    const baseConfig = {
      owner: config.owner ?? this.request.organizationName ?? '',
      repository: config.repository ?? this.request.repositoryName ?? '',
      ...(config.branch !== undefined || this.request.mainBranchName !== undefined
        ? { branch: config.branch ?? this.request.mainBranchName }
        : {}),
    };

    this.request.platformSpecific = {
      ...baseConfig,
      ...config,
    };

    // Update the platform if not set
    this.request.dopPlatform ??= DevOpsPlatform.GITHUB;

    return this;
  }

  /**
   * Configure GitLab-specific settings
   */
  withGitLabConfig(config: Partial<GitLabConfig>): this {
    const baseConfig = {
      namespace: config.namespace ?? this.request.organizationName ?? '',
      project: config.project ?? this.request.repositoryName ?? '',
      ...(config.branch !== undefined || this.request.mainBranchName !== undefined
        ? { branch: config.branch ?? this.request.mainBranchName }
        : {}),
    };

    this.request.platformSpecific = {
      ...baseConfig,
      ...config,
    };

    // Update the platform if not set
    this.request.dopPlatform ??= DevOpsPlatform.GITLAB;

    return this;
  }

  /**
   * Configure Bitbucket-specific settings
   */
  withBitbucketConfig(config: Partial<BitbucketConfig>): this {
    const baseConfig = {
      workspace: config.workspace ?? this.request.organizationName ?? '',
      repository: config.repository ?? this.request.repositoryName ?? '',
      ...(config.branch !== undefined || this.request.mainBranchName !== undefined
        ? { branch: config.branch ?? this.request.mainBranchName }
        : {}),
    };

    this.request.platformSpecific = {
      ...baseConfig,
      ...config,
    };

    // Update the platform if not set
    this.request.dopPlatform ??= DevOpsPlatform.BITBUCKET;

    return this;
  }

  /**
   * Configure Azure DevOps-specific settings
   */
  withAzureDevOpsConfig(config: Partial<AzureDevOpsConfig>): this {
    const baseConfig = {
      organization: config.organization ?? this.request.organizationName ?? '',
      project: config.project ?? this.request.repositoryName ?? '',
      repository: config.repository ?? this.request.repositoryName ?? '',
      ...(config.branch !== undefined || this.request.mainBranchName !== undefined
        ? { branch: config.branch ?? this.request.mainBranchName }
        : {}),
    };

    this.request.platformSpecific = {
      ...baseConfig,
      ...config,
    };

    // Update the platform if not set
    this.request.dopPlatform ??= DevOpsPlatform.AzureDevops;

    return this;
  }

  /**
   * Configure SonarQube project settings
   */
  withSonarQubeProject(config: Partial<SonarQubeProjectConfig>): this {
    this.request.sonarQubeProjectConfig = {
      ...this.request.sonarQubeProjectConfig,
      ...config,
    };
    return this;
  }

  /**
   * Set SonarQube project key
   */
  withProjectKey(key: string): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.key = key;
    return this;
  }

  /**
   * Set SonarQube project name
   */
  withProjectName(name: string): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.name = name;
    return this;
  }

  /**
   * Set SonarQube project description
   */
  withProjectDescription(description: string): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.description = description;
    return this;
  }

  /**
   * Set project visibility
   */
  withVisibility(visibility: ProjectVisibility): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.visibility = visibility;
    return this;
  }

  /**
   * Set quality gate
   */
  withQualityGate(qualityGate: string): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.qualityGate = qualityGate;
    return this;
  }

  /**
   * Set project tags
   */
  withTags(tags: string[]): this {
    this.request.sonarQubeProjectConfig ??= {};
    this.request.sonarQubeProjectConfig.tags = tags;
    return this;
  }

  /**
   * Validate the current configuration
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(): Promise<ValidationResult> {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (this.request.dopPlatform === undefined) {
      errors.push({
        field: 'dopPlatform',
        message: 'DevOps platform is required',
        code: 'MISSING_PLATFORM',
      });
    }

    if (this.request.projectIdentifier === undefined || this.request.projectIdentifier === '') {
      errors.push({
        field: 'projectIdentifier',
        message: 'Project identifier is required',
        code: 'MISSING_PROJECT_ID',
      });
    }

    // Platform-specific validation
    if (this.request.dopPlatform !== undefined && this.request.platformSpecific !== undefined) {
      const platformValidation = this.validatePlatformSpecific();
      errors.push(...platformValidation.errors);
      warnings.push(...platformValidation.warnings);
    }

    // SonarQube project validation
    if (this.request.sonarQubeProjectConfig !== undefined) {
      const projectValidation = this.validateSonarQubeProject();
      errors.push(...projectValidation.errors);
      warnings.push(...projectValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Execute the project creation
   */
  async execute(): Promise<CreateBoundProjectV2Response> {
    const validation = await this.validate();

    if (!validation.valid) {
      throw new Error(
        `Builder validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    return this.client.createBoundProjectV2(this.request as CreateBoundProjectV2Request);
  }

  /**
   * Update project identifier when organization or repository changes
   */
  private updateProjectIdentifier(): void {
    if (
      this.request.organizationName !== undefined &&
      this.request.organizationName !== '' &&
      this.request.repositoryName !== undefined &&
      this.request.repositoryName !== '' &&
      (this.request.projectIdentifier === undefined || this.request.projectIdentifier === '')
    ) {
      this.request.projectIdentifier = `${this.request.organizationName}/${this.request.repositoryName}`;
    }
  }

  /**
   * Validate platform-specific configuration
   */
  private validatePlatformSpecific(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.request.platformSpecific || this.request.dopPlatform === undefined) {
      return { errors, warnings };
    }

    switch (this.request.dopPlatform) {
      case DevOpsPlatform.GITHUB:
        return this.validateGitHubSpecific();
      case DevOpsPlatform.GITLAB:
        return this.validateGitLabSpecific();
      case DevOpsPlatform.BITBUCKET:
        return this.validateBitbucketSpecific();
      case DevOpsPlatform.AzureDevops:
        return this.validateAzureDevOpsSpecific();
      default:
        errors.push({
          field: 'platformSpecific',
          message: 'Unknown platform configuration',
          code: 'UNKNOWN_PLATFORM_CONFIG',
        });
    }

    return { errors, warnings };
  }

  /**
   * Validate GitHub-specific configuration
   */
  private validateGitHubSpecific(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const config = this.request.platformSpecific as GitHubConfig;

    if (!config.owner) {
      errors.push({
        field: 'platformSpecific.owner',
        message: 'GitHub owner is required',
        code: 'MISSING_GITHUB_OWNER',
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'platformSpecific.repository',
        message: 'GitHub repository is required',
        code: 'MISSING_GITHUB_REPO',
      });
    }

    // Check for valid GitHub naming conventions
    if (config.owner && !/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/.test(config.owner)) {
      warnings.push({
        field: 'platformSpecific.owner',
        message: 'GitHub owner name may not follow naming conventions',
        suggestion: 'Use alphanumeric characters and hyphens only',
      });
    }

    if (config.repository && !/^[a-zA-Z0-9._-]+$/.test(config.repository)) {
      warnings.push({
        field: 'platformSpecific.repository',
        message: 'GitHub repository name may not follow naming conventions',
        suggestion: 'Use alphanumeric characters, dots, underscores, and hyphens only',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate GitLab-specific configuration
   */
  private validateGitLabSpecific(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const config = this.request.platformSpecific as GitLabConfig;

    if (!config.namespace) {
      errors.push({
        field: 'platformSpecific.namespace',
        message: 'GitLab namespace is required',
        code: 'MISSING_GITLAB_NAMESPACE',
      });
    }

    if (!config.project) {
      errors.push({
        field: 'platformSpecific.project',
        message: 'GitLab project is required',
        code: 'MISSING_GITLAB_PROJECT',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate Bitbucket-specific configuration
   */
  private validateBitbucketSpecific(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const config = this.request.platformSpecific as BitbucketConfig;

    if (!config.workspace) {
      errors.push({
        field: 'platformSpecific.workspace',
        message: 'Bitbucket workspace is required',
        code: 'MISSING_BITBUCKET_WORKSPACE',
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'platformSpecific.repository',
        message: 'Bitbucket repository is required',
        code: 'MISSING_BITBUCKET_REPO',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate Azure DevOps-specific configuration
   */
  private validateAzureDevOpsSpecific(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const config = this.request.platformSpecific as AzureDevOpsConfig;

    if (!config.organization) {
      errors.push({
        field: 'platformSpecific.organization',
        message: 'Azure DevOps organization is required',
        code: 'MISSING_AZURE_ORG',
      });
    }

    if (!config.project) {
      errors.push({
        field: 'platformSpecific.project',
        message: 'Azure DevOps project is required',
        code: 'MISSING_AZURE_PROJECT',
      });
    }

    if (!config.repository) {
      errors.push({
        field: 'platformSpecific.repository',
        message: 'Azure DevOps repository is required',
        code: 'MISSING_AZURE_REPO',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate SonarQube project configuration
   */
  private validateSonarQubeProject(): {
    errors: DopValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const config = this.request.sonarQubeProjectConfig ?? {};

    // Validate project key format if provided
    if (config.key !== undefined && config.key !== '') {
      if (!/^[a-zA-Z0-9:_.-]+$/.test(config.key)) {
        errors.push({
          field: 'sonarQubeProjectConfig.key',
          message: 'Invalid SonarQube project key format',
          code: 'INVALID_PROJECT_KEY',
        });
      }

      if (config.key.length > 400) {
        errors.push({
          field: 'sonarQubeProjectConfig.key',
          message: 'SonarQube project key too long (max 400 characters)',
          code: 'PROJECT_KEY_TOO_LONG',
        });
      }
    }

    // Validate project name if provided
    if (config.name !== undefined && config.name.length > 2000) {
      errors.push({
        field: 'sonarQubeProjectConfig.name',
        message: 'SonarQube project name too long (max 2000 characters)',
        code: 'PROJECT_NAME_TOO_LONG',
      });
    }

    // Validate description if provided
    if (config.description !== undefined && config.description.length > 2000) {
      warnings.push({
        field: 'sonarQubeProjectConfig.description',
        message: 'SonarQube project description is very long',
        suggestion: 'Consider shortening to improve readability',
      });
    }

    return { errors, warnings };
  }
}
