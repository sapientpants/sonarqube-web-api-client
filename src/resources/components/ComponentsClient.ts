import { BaseClient } from '../../core/BaseClient';
import { ComponentsTreeBuilder } from './builders';
import type {
  ComponentShowResponse,
  ComponentSearchResponse,
  ComponentTreeRequest,
  ComponentTreeResponse,
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
   * Search for projects.
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
   * @deprecated Use tree() method instead
   *
   * @example
   * ```typescript
   * // Search for projects in an organization
   * const results = await client.components.search('my-org', {
   *   q: 'sonar',
   *   ps: 50
   * });
   * ```
   */
  async search(
    organization: string,
    options: {
      q?: string;
      p?: number;
      ps?: number;
    } = {}
    // eslint-disable-next-line @typescript-eslint/no-deprecated
  ): Promise<ComponentSearchResponse> {
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

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return this.request<ComponentSearchResponse>(`/api/components/search?${params.toString()}`);
  }

  /**
   * Navigate through components based on the chosen strategy.
   * Requires Browse permission on the specified project.
   * When limiting search with the q parameter, directories are not returned.
   *
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
  tree(): ComponentsTreeBuilder {
    return new ComponentsTreeBuilder(async (params: ComponentTreeRequest) => {
      const searchParams = new URLSearchParams();

      // Required parameter
      searchParams.set('component', params.component);

      // Optional parameters
      if (params.branch !== undefined && params.branch !== '') {
        searchParams.set('branch', params.branch);
      }
      if (params.pullRequest !== undefined && params.pullRequest !== '') {
        searchParams.set('pullRequest', params.pullRequest);
      }
      if (params.q !== undefined && params.q !== '') {
        searchParams.set('q', params.q);
      }
      if (params.qualifiers !== undefined && params.qualifiers.length > 0) {
        searchParams.set('qualifiers', params.qualifiers.join(','));
      }
      if (params.s !== undefined && params.s.length > 0) {
        searchParams.set('s', params.s.join(','));
      }
      if (params.asc !== undefined) {
        searchParams.set('asc', params.asc);
      }
      if (params.strategy !== undefined) {
        searchParams.set('strategy', params.strategy);
      }
      if (params.p !== undefined && params.p > 0) {
        searchParams.set('p', params.p.toString());
      }
      if (params.ps !== undefined && params.ps > 0) {
        searchParams.set('ps', params.ps.toString());
      }

      return this.request<ComponentTreeResponse>(`/api/components/tree?${searchParams.toString()}`);
    });
  }
}
