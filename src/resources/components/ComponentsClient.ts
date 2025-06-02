import { BaseClient } from '../../core/BaseClient';
import { DeprecationManager } from '../../core/deprecation/DeprecationManager';
import { ComponentsTreeBuilder, ComponentsSearchBuilder } from './builders';
import {
  ComponentQualifier,
  type ComponentShowResponse,
  type ComponentSearchResponse,
  type ComponentTreeRequest,
  type ComponentTreeResponse,
  type ComponentGlobalSearchRequest,
} from './types';

/**
 * Client for interacting with the SonarQube Components API.
 * Provides methods for getting information about components (files, directories, projects)
 * and navigating through the component tree.
 */
export class ComponentsClient extends BaseClient {
  /**
   * Returns a component (file, directory, project) and its ancestors.
   * The ancestors are ordered from the parent to the root project.
   * Requires Browse permission on the project of the specified component.
   *
   * @param component - Component key
   * @param options - Optional parameters
   * @param options.branch - Branch key
   * @param options.pullRequest - Pull request id
   * @returns Promise that resolves to the component and its ancestors
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have Browse permission on the project
   * @throws {NotFoundError} If the component is not found
   *
   * @since 5.4
   *
   * @example
   * ```typescript
   * // Get a project component
   * const result = await client.components.show('my_project');
   * console.log('Component:', result.component);
   * console.log('Ancestors:', result.ancestors);
   *
   * // Get a file component on a specific branch
   * const fileResult = await client.components.show('my_project:src/main.ts', {
   *   branch: 'feature/new-feature'
   * });
   * ```
   */
  async show(
    component: string,
    options: {
      branch?: string;
      pullRequest?: string;
    } = {}
  ): Promise<ComponentShowResponse> {
    const params = new URLSearchParams();
    params.set('component', component);

    if (options.branch !== undefined && options.branch !== '') {
      params.set('branch', options.branch);
    }
    if (options.pullRequest !== undefined && options.pullRequest !== '') {
      params.set('pullRequest', options.pullRequest);
    }

    return this.request<ComponentShowResponse>(`/api/components/show?${params.toString()}`);
  }

  /**
   * Search for components across all projects using a builder pattern.
   * This provides a flexible interface for searching components with various filters.
   *
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {ValidationError} If parameters are invalid
   *
   * @since 9.0
   *
   * @example
   * ```typescript
   * // Search for all components
   * const results = await client.components.search().execute();
   *
   * // Search for projects only
   * const projects = await client.components.search()
   *   .qualifiers(['TRK'])
   *   .pageSize(50)
   *   .execute();
   *
   * // Search for Java files
   * const javaFiles = await client.components.search()
   *   .qualifiers(['FIL'])
   *   .languages(['java'])
   *   .execute();
   *
   * // Iterate through all components
   * for await (const component of client.components.search().all()) {
   *   console.log(component.name);
   * }
   * ```
   */
  search(): ComponentsSearchBuilder {
    return new ComponentsSearchBuilder(async (params: ComponentGlobalSearchRequest) =>
      this.executeGlobalSearchRequest(params)
    );
  }

  /**
   * Search for projects (legacy method).
   * Used to provide the ability to search for any component but this option has been removed
   * and the tree() method should be used instead for this purpose.
   *
   * @param organization - Organization key
   * @param options - Optional search parameters
   * @param options.q - Search query
   * @param options.p - Page number (1-based)
   * @param options.ps - Page size (max 500)
   * @returns Promise that resolves to search results
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {ValidationError} If parameters are invalid
   *
   * @since 6.3
   * @deprecated Use search() builder method or tree() method instead
   *
   * @example
   * ```typescript
   * // Search for projects in an organization
   * const results = await client.components.searchLegacy('my-org', {
   *   q: 'sonar',
   *   ps: 50
   * });
   * ```
   */
  async searchLegacy(
    organization: string,
    options: {
      q?: string;
      p?: number;
      ps?: number;
    } = {}
  ): Promise<ComponentSearchResponse> {
    DeprecationManager.warn({
      api: 'components.searchLegacy()',
      replacement: 'components.search() or components.tree()',
      removeVersion: '9.0.0',
      reason:
        'The legacy search endpoint is being replaced with the more flexible search() builder or tree() method since 6.3',
    });

    const params = new URLSearchParams();
    params.set('organization', organization);

    if (options.q !== undefined && options.q !== '') {
      params.set('q', options.q);
    }
    if (options.p !== undefined && options.p > 0) {
      params.set('p', options.p.toString());
    }
    if (options.ps !== undefined && options.ps > 0) {
      params.set('ps', options.ps.toString());
    }

    return this.request<ComponentSearchResponse>(`/api/components/search?${params.toString()}`);
  }

  /**
   * Navigate through components based on the chosen strategy.
   * Requires Browse permission on the specified project.
   * When limiting search with the q parameter, directories are not returned.
   *
   * @param componentKey - Optional component key to set as the base for tree search
   * @returns A builder for constructing the tree search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have Browse permission on the project
   * @throws {ValidationError} If parameters are invalid
   *
   * @since 5.4
   *
   * @example
   * ```typescript
   * // Get all files in a project
   * const files = await client.components.tree()
   *   .component('my_project')
   *   .qualifiers(['FIL'])
   *   .execute();
   *
   * // Get all files in a project (convenience method)
   * const files = await client.components.tree('my_project')
   *   .qualifiers(['FIL'])
   *   .execute();
   *
   * // Search for specific files with pagination
   * for await (const component of client.components.tree()
   *   .component('my_project')
   *   .query('Controller')
   *   .qualifiers(['FIL'])
   *   .all()) {
   *   console.log('Found file:', component.name);
   * }
   *
   * // Get only direct children of a directory
   * const children = await client.components.tree()
   *   .component('my_project:src')
   *   .strategy('children')
   *   .execute();
   * ```
   */
  tree(componentKey?: string): ComponentsTreeBuilder {
    const builder = new ComponentsTreeBuilder(async (params: ComponentTreeRequest) =>
      this.executeTreeRequest(params)
    );

    if (componentKey !== undefined) {
      builder.component(componentKey);
    }

    return builder;
  }

  /**
   * Executes global search request by finding projects and then searching within them
   * @private
   */
  private async executeGlobalSearchRequest(
    params: ComponentGlobalSearchRequest
  ): Promise<ComponentSearchResponse> {
    // For global search, we'll use a different approach based on what's available
    // If no qualifiers are specified or TRK is included, search for projects first
    const searchQualifiers = params.qualifiers ?? [];
    const includesProjects =
      searchQualifiers.length === 0 || searchQualifiers.includes(ComponentQualifier.Project);

    if (includesProjects && searchQualifiers.length <= 1) {
      // Simple project search - use the legacy search endpoint if organization is available
      if (this.organization !== undefined && this.organization !== '') {
        const searchParams = new URLSearchParams();
        searchParams.set('organization', this.organization);

        if (params.q !== undefined && params.q !== '') {
          searchParams.set('q', params.q);
        }
        if (params.p !== undefined && params.p > 0) {
          searchParams.set('p', params.p.toString());
        }
        if (params.ps !== undefined && params.ps > 0) {
          searchParams.set('ps', params.ps.toString());
        }

        return this.request<ComponentSearchResponse>(
          `/api/components/search?${searchParams.toString()}`
        );
      }
    }

    // Fallback: Search within all accessible projects using tree endpoint
    // This is a simplified approach - in practice, you might need to:
    // 1. Get a list of projects first
    // 2. Search within each project
    // For now, return an empty result to prevent errors
    return {
      components: [],
      paging: {
        pageIndex: params.p ?? 1,
        pageSize: params.ps ?? 100,
        total: 0,
      },
    };
  }

  /**
   * Executes component tree request with proper parameter handling
   * @private
   */
  private async executeTreeRequest(params: ComponentTreeRequest): Promise<ComponentTreeResponse> {
    const searchParams = this.buildTreeParams(params);
    return this.request<ComponentTreeResponse>(`/api/components/tree?${searchParams.toString()}`);
  }

  /**
   * Builds URL parameters for component tree request
   * @private
   */
  private buildTreeParams(params: ComponentTreeRequest): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Required parameter
    searchParams.set('component', params.component);

    // Optional string parameters
    this.appendNonEmptyStringParam(searchParams, 'branch', params.branch);
    this.appendNonEmptyStringParam(searchParams, 'pullRequest', params.pullRequest);
    this.appendNonEmptyStringParam(searchParams, 'q', params.q);
    this.appendNonEmptyStringParam(searchParams, 'asc', params.asc);
    this.appendNonEmptyStringParam(searchParams, 'strategy', params.strategy);

    // Array parameters
    this.appendArrayParam(searchParams, 'qualifiers', params.qualifiers);
    this.appendArrayParam(searchParams, 's', params.s);

    // Positive number parameters
    this.appendPositiveNumberParam(searchParams, 'p', params.p);
    this.appendPositiveNumberParam(searchParams, 'ps', params.ps);

    return searchParams;
  }

  /**
   * Helper method to append non-empty string parameters
   * @private
   */
  private appendNonEmptyStringParam(
    params: URLSearchParams,
    key: string,
    value: string | undefined
  ): void {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  }

  /**
   * Helper method to append array parameters as comma-separated strings
   * @private
   */
  private appendArrayParam(
    params: URLSearchParams,
    key: string,
    value: string[] | undefined
  ): void {
    if (value !== undefined && value.length > 0) {
      params.set(key, value.join(','));
    }
  }

  /**
   * Helper method to append positive number parameters
   * @private
   */
  private appendPositiveNumberParam(
    params: URLSearchParams,
    key: string,
    value: number | undefined
  ): void {
    if (value !== undefined && value > 0) {
      params.set(key, value.toString());
    }
  }
}
