/**
 * DOP Translation API v2 Client for SonarQube Web API
 * Handles DevOps platform integration and project binding
 */

import { V2BaseClient } from '../../core/V2BaseClient.js';
import { PlatformValidationService } from '../../core/services/PlatformValidationService.js';
import {
  DevOpsPlatform,
  type CreateBoundProjectV2Request,
  type CreateBoundProjectV2Response,
  type DopSettingsV2Response,
  type CreateBoundProjectV2Builder,
  type BatchCreateRequest,
  type BatchCreateResponse,
  type BatchProjectResult,
} from './types.js';
import { CreateBoundProjectV2BuilderImpl } from './builders.js';

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
    request: CreateBoundProjectV2Request,
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
    const { projects, settings } = request;
    const parallelLimit = Math.min(settings.parallelLimit, projects.length);

    for (let i = 0; i < projects.length; i += parallelLimit) {
      const batch = projects.slice(i, i + parallelLimit);
      const batchResults = await this.processBatch(batch, settings);
      results.push(...batchResults);
    }

    return this.buildBatchResponse(results, projects.length, startTime);
  }

  /**
   * Process a batch of project creation requests
   * @private
   */
  private async processBatch(
    batch: CreateBoundProjectV2Request[],
    settings: BatchCreateRequest['settings'],
  ): Promise<BatchProjectResult[]> {
    const batchPromises = batch.map(async (projectRequest) =>
      this.processProjectRequest(projectRequest, settings),
    );

    try {
      return await Promise.all(batchPromises);
    } catch (error) {
      return this.handleBatchError(error, batch, settings);
    }
  }

  /**
   * Process a single project request
   * @private
   */
  private async processProjectRequest(
    projectRequest: CreateBoundProjectV2Request,
    settings: BatchCreateRequest['settings'],
  ): Promise<BatchProjectResult> {
    try {
      const result = await this.createBoundProjectV2(projectRequest);
      return {
        request: projectRequest,
        success: true,
        result,
      };
    } catch (error) {
      if (!settings.continueOnError) {
        throw error;
      }

      return {
        request: projectRequest,
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Handle batch processing error
   * @private
   */
  private handleBatchError(
    error: unknown,
    batch: CreateBoundProjectV2Request[],
    settings: BatchCreateRequest['settings'],
  ): BatchProjectResult[] {
    if (!settings.continueOnError) {
      throw error;
    }

    const firstRequest = batch[0];
    if (firstRequest) {
      return [
        {
          request: firstRequest,
          success: false,
          error: error as Error,
        },
      ];
    }

    return [];
  }

  /**
   * Build batch response with summary
   * @private
   */
  private buildBatchResponse(
    results: BatchProjectResult[],
    totalProjects: number,
    startTime: number,
  ): BatchCreateResponse {
    const successful = results.filter((r) => r.success).length;

    return {
      results,
      summary: {
        total: totalProjects,
        successful,
        failed: results.length - successful,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Validate a project creation request
   * @param request - Request to validate
   * @returns Validated request (throws if invalid)
   */
  private validateProjectRequest(
    request: CreateBoundProjectV2Request,
  ): CreateBoundProjectV2Request {
    if (!request.projectIdentifier) {
      throw new Error('Invalid request: Project identifier is required');
    }

    const validation = PlatformValidationService.validate(
      {
        platform: request.dopPlatform,
        identifier: request.projectIdentifier,
      },
      request.platformSpecific as unknown as Record<string, unknown> | undefined,
    );

    if (!validation.valid) {
      const errorMessages = this.transformValidationErrors(validation.errors, request.dopPlatform);
      throw new Error(`Invalid request: ${errorMessages.join(', ')}`);
    }

    this.logValidationWarnings(validation.warnings);

    return request;
  }

  /**
   * Transform validation errors to platform-specific messages
   * @private
   */
  private transformValidationErrors(
    errors: Array<{ message: string }>,
    platform: DevOpsPlatform,
  ): string[] {
    return errors.map((e) => this.mapErrorMessage(e.message, platform));
  }

  /**
   * Map generic error message to platform-specific one
   * @private
   */
  private mapErrorMessage(message: string, platform: DevOpsPlatform): string {
    if (message.includes('Owner is required') && platform === DevOpsPlatform.GITHUB) {
      return 'GitHub owner/organization is required';
    }
    if (message.includes('Namespace is required') && platform === DevOpsPlatform.GITLAB) {
      return 'GitLab namespace is required';
    }
    if (message.includes('Workspace is required') && platform === DevOpsPlatform.BITBUCKET) {
      return 'Bitbucket workspace is required';
    }
    if (message.includes('Organization is required') && platform === DevOpsPlatform.AzureDevops) {
      return 'Azure DevOps organization is required';
    }
    return message;
  }

  /**
   * Log validation warnings in development mode
   * @private
   */
  private logValidationWarnings(
    warnings: Array<{ field: string; message: string; suggestion?: string }>,
  ): void {
    if (warnings.length === 0 || process.env['NODE_ENV'] === 'production') {
      return;
    }

    for (const warning of warnings) {
      // eslint-disable-next-line no-console
      console.warn(`[DOP Translation] ${warning.field}: ${warning.message}`);
      if (warning.suggestion !== undefined && warning.suggestion !== '') {
        // eslint-disable-next-line no-console
        console.warn(`  Suggestion: ${warning.suggestion}`);
      }
    }
  }
}
