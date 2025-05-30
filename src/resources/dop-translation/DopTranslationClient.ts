/**
 * DOP Translation API v2 Client for SonarQube Web API
 * Handles DevOps platform integration and project binding
 */

import { BaseClient } from '../../core/BaseClient';
import type {
  CreateBoundProjectV2Request,
  CreateBoundProjectV2Response,
  DopSettingsV2Response,
  CreateBoundProjectV2Builder,
  BatchCreateRequest,
  BatchCreateResponse,
  BatchProjectResult,
  ValidationResult,
  ValidationError as DopValidationError,
  ValidationWarning,
  GitHubConfig,
  GitLabConfig,
  BitbucketConfig,
  AzureDevOpsConfig,
} from './types';
import { DevOpsPlatform } from './types';
import { CreateBoundProjectV2BuilderImpl } from './builders';

/**
 * Client for DOP Translation API v2 operations
 * Enables integration with DevOps platforms for automated project creation and binding
 */
export class DopTranslationClient extends BaseClient {
  /**
   * Create a SonarQube project bound to a DevOps platform project
   * @param request - Project creation and binding request
   * @returns Promise resolving to the created bound project
   */
  async createBoundProjectV2(
    request: CreateBoundProjectV2Request
  ): Promise<CreateBoundProjectV2Response> {
    const validated = await this.validateProjectRequest(request);

    return this.request<CreateBoundProjectV2Response>('/api/v2/dop-translation/bound-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    });
  }

  /**
   * Get all configured DevOps Platform Integration settings
   * @returns Promise resolving to platform settings
   */
  async getDopSettingsV2(): Promise<DopSettingsV2Response> {
    return this.request<DopSettingsV2Response>('/api/v2/dop-translation/dop-settings');
  }

  /**
   * Create a fluent builder for bound project creation
   * @returns Builder instance for chaining configuration
   */
  createBoundProject(): CreateBoundProjectV2Builder {
    return new CreateBoundProjectV2BuilderImpl(this);
  }

  /**
   * Create multiple bound projects in batch
   * @param request - Batch creation request with multiple projects
   * @returns Promise resolving to batch operation results
   */
  async createBoundProjectsBatch(request: BatchCreateRequest): Promise<BatchCreateResponse> {
    const results: BatchProjectResult[] = [];
    const startTime = Date.now();

    // Process projects according to parallel limit
    const { projects, settings } = request;
    const parallelLimit = Math.min(settings.parallelLimit, projects.length);

    for (let i = 0; i < projects.length; i += parallelLimit) {
      const batch = projects.slice(i, i + parallelLimit);

      const batchPromises = batch.map(async (projectRequest) => {
        try {
          const result = await this.createBoundProjectV2(projectRequest);
          return {
            request: projectRequest,
            success: true,
            result,
          } as BatchProjectResult;
        } catch (error) {
          const result: BatchProjectResult = {
            request: projectRequest,
            success: false,
            error: error as Error,
          };

          if (!settings.continueOnError) {
            throw error;
          }

          return result;
        }
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        if (!settings.continueOnError) {
          // Add the error result and stop processing
          const firstRequest = batch[0];
          if (firstRequest) {
            results.push({
              request: firstRequest,
              success: false,
              error: error as Error,
            });
          }
          break;
        }
      }
    }

    const endTime = Date.now();
    const successful = results.filter((r) => r.success).length;

    return {
      results,
      summary: {
        total: projects.length,
        successful,
        failed: results.length - successful,
        duration: endTime - startTime,
      },
    };
  }

  /**
   * Validate a project creation request
   * @param request - Request to validate
   * @returns Validated request (throws if invalid)
   */
  private async validateProjectRequest(
    request: CreateBoundProjectV2Request
  ): Promise<CreateBoundProjectV2Request> {
    const validation = await this.validatePlatformConfig(request);

    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    return request;
  }

  /**
   * Validate platform-specific configuration
   * @param request - Request to validate
   * @returns Validation result
   */
  private async validatePlatformConfig(
    request: CreateBoundProjectV2Request
  ): Promise<ValidationResult> {
    const errors: DopValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic validation
    if (!request.dopPlatform) {
      errors.push({
        field: 'dopPlatform',
        message: 'DevOps platform is required',
        code: 'MISSING_PLATFORM',
      });
    }

    if (!request.projectIdentifier) {
      errors.push({
        field: 'projectIdentifier',
        message: 'Project identifier is required',
        code: 'MISSING_PROJECT_ID',
      });
    }

    // Platform-specific validation
    switch (request.dopPlatform) {
      case DevOpsPlatform.GITHUB:
        return this.validateGitHubConfig(request, errors, warnings);
      case DevOpsPlatform.GITLAB:
        return this.validateGitLabConfig(request, errors, warnings);
      case DevOpsPlatform.BITBUCKET:
        return this.validateBitbucketConfig(request, errors, warnings);
      case DevOpsPlatform.AZURE_DEVOPS:
        return this.validateAzureDevOpsConfig(request, errors, warnings);
      default:
        errors.push({
          field: 'dopPlatform',
          message: 'Unsupported DevOps platform',
          code: 'UNSUPPORTED_PLATFORM',
        });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate GitHub-specific configuration
   */
  private async validateGitHubConfig(
    request: CreateBoundProjectV2Request,
    errors: DopValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    const config = request.platformSpecific as GitHubConfig;

    if (config) {
      if (!config.owner) {
        errors.push({
          field: 'platformSpecific.owner',
          message: 'GitHub owner/organization is required',
          code: 'MISSING_GITHUB_OWNER',
          platform: DevOpsPlatform.GITHUB,
        });
      }

      if (!config.repository) {
        errors.push({
          field: 'platformSpecific.repository',
          message: 'GitHub repository name is required',
          code: 'MISSING_GITHUB_REPO',
          platform: DevOpsPlatform.GITHUB,
        });
      }

      // Validate project identifier format
      if (request.projectIdentifier && !request.projectIdentifier.includes('/')) {
        warnings.push({
          field: 'projectIdentifier',
          message: 'GitHub project identifier should be in format "owner/repository"',
          suggestion: `${config.owner}/${config.repository}`,
          platform: DevOpsPlatform.GITHUB,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate GitLab-specific configuration
   */
  private async validateGitLabConfig(
    request: CreateBoundProjectV2Request,
    errors: DopValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    const config = request.platformSpecific as GitLabConfig;

    if (config) {
      if (!config.namespace) {
        errors.push({
          field: 'platformSpecific.namespace',
          message: 'GitLab namespace is required',
          code: 'MISSING_GITLAB_NAMESPACE',
          platform: DevOpsPlatform.GITLAB,
        });
      }

      if (!config.project) {
        errors.push({
          field: 'platformSpecific.project',
          message: 'GitLab project name is required',
          code: 'MISSING_GITLAB_PROJECT',
          platform: DevOpsPlatform.GITLAB,
        });
      }

      // Validate project identifier format
      if (request.projectIdentifier && !request.projectIdentifier.includes('/')) {
        warnings.push({
          field: 'projectIdentifier',
          message: 'GitLab project identifier should be in format "namespace/project"',
          suggestion: `${config.namespace}/${config.project}`,
          platform: DevOpsPlatform.GITLAB,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Bitbucket-specific configuration
   */
  private async validateBitbucketConfig(
    request: CreateBoundProjectV2Request,
    errors: DopValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    const config = request.platformSpecific as BitbucketConfig;

    if (config) {
      if (!config.workspace) {
        errors.push({
          field: 'platformSpecific.workspace',
          message: 'Bitbucket workspace is required',
          code: 'MISSING_BITBUCKET_WORKSPACE',
          platform: DevOpsPlatform.BITBUCKET,
        });
      }

      if (!config.repository) {
        errors.push({
          field: 'platformSpecific.repository',
          message: 'Bitbucket repository name is required',
          code: 'MISSING_BITBUCKET_REPO',
          platform: DevOpsPlatform.BITBUCKET,
        });
      }

      // Validate project identifier format
      if (request.projectIdentifier && !request.projectIdentifier.includes('/')) {
        warnings.push({
          field: 'projectIdentifier',
          message: 'Bitbucket project identifier should be in format "workspace/repository"',
          suggestion: `${config.workspace}/${config.repository}`,
          platform: DevOpsPlatform.BITBUCKET,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Azure DevOps-specific configuration
   */
  private async validateAzureDevOpsConfig(
    request: CreateBoundProjectV2Request,
    errors: DopValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    const config = request.platformSpecific as AzureDevOpsConfig;

    if (config) {
      if (!config.organization) {
        errors.push({
          field: 'platformSpecific.organization',
          message: 'Azure DevOps organization is required',
          code: 'MISSING_AZURE_ORG',
          platform: DevOpsPlatform.AZURE_DEVOPS,
        });
      }

      if (!config.project) {
        errors.push({
          field: 'platformSpecific.project',
          message: 'Azure DevOps project is required',
          code: 'MISSING_AZURE_PROJECT',
          platform: DevOpsPlatform.AZURE_DEVOPS,
        });
      }

      if (!config.repository) {
        errors.push({
          field: 'platformSpecific.repository',
          message: 'Azure DevOps repository is required',
          code: 'MISSING_AZURE_REPO',
          platform: DevOpsPlatform.AZURE_DEVOPS,
        });
      }

      // Validate project identifier format
      if (request.projectIdentifier && !request.projectIdentifier.includes('/')) {
        warnings.push({
          field: 'projectIdentifier',
          message: 'Azure DevOps project identifier should be in format "organization/project"',
          suggestion: `${config.organization}/${config.project}`,
          platform: DevOpsPlatform.AZURE_DEVOPS,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
