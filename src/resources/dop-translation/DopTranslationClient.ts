/**
 * DOP Translation API v2 Client for SonarQube Web API
 * Handles DevOps platform integration and project binding
 */

import { V2BaseClient } from '../../core/V2BaseClient';
import { PlatformValidationService } from '../../core/services/PlatformValidationService';
import {
  DevOpsPlatform,
  type CreateBoundProjectV2Request,
  type CreateBoundProjectV2Response,
  type DopSettingsV2Response,
  type CreateBoundProjectV2Builder,
  type BatchCreateRequest,
  type BatchCreateResponse,
  type BatchProjectResult,
} from './types';
import { CreateBoundProjectV2BuilderImpl } from './builders';

/**
 * Client for DOP Translation API v2 operations
 * Enables integration with DevOps platforms for automated project creation and binding
 */
export class DopTranslationClient extends V2BaseClient {
  /**
   * Create a SonarQube project bound to a DevOps platform project
   * @param request - Project creation and binding request
   * @returns Promise resolving to the created bound project
   */
  async createBoundProjectV2(
    request: CreateBoundProjectV2Request
  ): Promise<CreateBoundProjectV2Response> {
    const validated = this.validateProjectRequest(request);

    return this.request<CreateBoundProjectV2Response>('/api/v2/dop-translation/bound-projects', {
      method: 'POST',
      headers: { ['Content-Type']: 'application/json' },
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
          throw error; // Re-throw the error when continueOnError is false
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
  private validateProjectRequest(
    request: CreateBoundProjectV2Request
  ): CreateBoundProjectV2Request {
    // Basic validation
    if (!request.projectIdentifier) {
      throw new Error('Invalid request: Project identifier is required');
    }

    // Use PlatformValidationService for platform-specific validation
    const validation = PlatformValidationService.validate(
      {
        platform: request.dopPlatform as DevOpsPlatform,
        identifier: request.projectIdentifier,
      },
      request.platformSpecific as Record<string, unknown> | undefined
    );

    if (!validation.valid) {
      // Transform error messages to match expected format
      const errorMessages = validation.errors.map((e) => {
        // Map generic messages to platform-specific ones
        if (
          e.message.includes('Owner is required') &&
          request.dopPlatform === DevOpsPlatform.GITHUB
        ) {
          return 'GitHub owner/organization is required';
        }
        if (
          e.message.includes('Namespace is required') &&
          request.dopPlatform === DevOpsPlatform.GITLAB
        ) {
          return 'GitLab namespace is required';
        }
        if (
          e.message.includes('Workspace is required') &&
          request.dopPlatform === DevOpsPlatform.BITBUCKET
        ) {
          return 'Bitbucket workspace is required';
        }
        if (
          e.message.includes('Organization is required') &&
          request.dopPlatform === DevOpsPlatform.AzureDevops
        ) {
          return 'Azure DevOps organization is required';
        }
        return e.message;
      });

      throw new Error(`Invalid request: ${errorMessages.join(', ')}`);
    }

    // Log warnings if any (in development only)
    // eslint-disable-next-line no-console
    if (validation.warnings.length > 0 && process.env.NODE_ENV !== 'production') {
      validation.warnings.forEach((warning) => {
        // eslint-disable-next-line no-console
        console.warn(`[DOP Translation] ${warning.field}: ${warning.message}`);
        if (warning.suggestion !== undefined && warning.suggestion !== '') {
          // eslint-disable-next-line no-console
          console.warn(`  Suggestion: ${warning.suggestion}`);
        }
      });
    }

    return request;
  }
}
