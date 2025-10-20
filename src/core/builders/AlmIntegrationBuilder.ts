import { BaseBuilder } from './BaseBuilder.js';
import {
  PaginatedBuilder,
  type PaginatedRequest,
  type PaginatedResponse,
} from './PaginatedBuilder.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Validates that an ALM setting is provided
 * @param almSetting - The ALM setting to validate
 * @throws {ValidationError} if almSetting is not set
 */
function validateAlmSetting(almSetting: string | undefined): void {
  if (almSetting === undefined || almSetting.trim() === '') {
    throw new ValidationError('almSetting is required');
  }
}

/**
 * Base builder for ALM integration operations that require an ALM setting
 */
export abstract class AlmIntegrationBuilder<
  TRequest extends { almSetting?: string | undefined },
  TResponse = void,
> extends BaseBuilder<TRequest, TResponse> {
  /**
   * Set the ALM setting key
   * @param almSetting - The ALM setting key
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting' as keyof TRequest, almSetting as TRequest[keyof TRequest]);
  }

  /**
   * Validates that the ALM setting is provided
   * @throws {ValidationError} if almSetting is not set
   */
  protected validateAlmSetting(): void {
    validateAlmSetting(this.params.almSetting);
  }
}

/**
 * Base builder for paginated ALM repository search operations
 */
export abstract class RepositorySearchBuilder<
  TRequest extends { almSetting?: string; q?: string; projectKey?: string } & PaginatedRequest,
  TResponse extends PaginatedResponse,
  TItem,
> extends PaginatedBuilder<TRequest, TResponse, TItem> {
  /**
   * Set the ALM setting key
   * @param almSetting - The ALM setting key
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting' as keyof TRequest, almSetting as TRequest[keyof TRequest]);
  }

  /**
   * Set the search query
   * @param query - The search query
   */
  withQuery(query: string): this {
    return this.setParam('q' as keyof TRequest, query as TRequest[keyof TRequest]);
  }

  /**
   * Filter by project
   * @param projectKey - The project key
   */
  inProject(projectKey: string): this {
    return this.setParam('projectKey' as keyof TRequest, projectKey as TRequest[keyof TRequest]);
  }

  /**
   * Validates that the ALM setting is provided
   * @throws {ValidationError} if almSetting is not set
   */
  protected validateAlmSetting(): void {
    validateAlmSetting(this.params.almSetting);
  }
}
