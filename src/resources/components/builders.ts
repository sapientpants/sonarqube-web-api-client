import { PaginatedBuilder } from '../../core/builders';
import { ValidationError } from '../../errors';
import {
  type ComponentTreeRequest,
  type ComponentTreeResponse,
  type ComponentGlobalSearchRequest,
  type ComponentSearchResponse,
  type Component,
  ComponentQualifier,
  ComponentSortField,
  ComponentTreeStrategy,
} from './types';

/**
 * Builder for searching components across all projects
 * This provides a simpler interface for general component search
 */
export class ComponentsSearchBuilder extends PaginatedBuilder<
  ComponentGlobalSearchRequest,
  ComponentSearchResponse,
  Component
> {
  /**
   * Set search query to filter components
   * @param query - Search query
   */
  query(query: string): this {
    return this.setParam('q', query);
  }

  /**
   * Filter by component qualifiers
   * @param qualifiers - Array of component qualifiers
   */
  qualifiers(qualifiers: ComponentQualifier[]): this {
    return this.setParam('qualifiers', qualifiers);
  }

  /**
   * Filter by languages
   * @param languages - Array of language keys
   */
  languages(languages: string[]): this {
    return this.setParam('languages', languages);
  }

  /**
   * Execute the search request
   */
  async execute(): Promise<ComponentSearchResponse> {
    return this.executor(this.params as ComponentGlobalSearchRequest);
  }

  /**
   * Extract components array from response for pagination
   */
  protected getItems(response: ComponentSearchResponse): Component[] {
    return response.components;
  }
}

/**
 * Builder for constructing complex component tree queries
 */
export class ComponentsTreeBuilder extends PaginatedBuilder<
  ComponentTreeRequest,
  ComponentTreeResponse,
  Component
> {
  /**
   * Set the base component key for the search
   * @param componentKey - Base component key
   */
  component(componentKey: string): this {
    return this.setParam('component', componentKey);
  }

  /**
   * Set the branch key
   * @param branch - Branch key
   */
  branch(branch: string): this {
    return this.setParam('branch', branch);
  }

  /**
   * Set the pull request id
   * @param pullRequest - Pull request id
   */
  pullRequest(pullRequest: string): this {
    return this.setParam('pullRequest', pullRequest);
  }

  /**
   * Set search query to limit search to component names or keys
   * @param query - Search query (minimum 3 characters)
   */
  query(query: string): this {
    if (query.length < 3) {
      throw new ValidationError(
        'Query parameter must be at least 3 characters long',
        'INVALID_QUERY_LENGTH'
      );
    }
    return this.setParam('q', query);
  }

  /**
   * Filter by component qualifiers
   * @param qualifiers - Array of component qualifiers
   */
  qualifiers(qualifiers: ComponentQualifier[]): this {
    return this.setParam('qualifiers', qualifiers);
  }

  /**
   * Set sort fields
   * @param fields - Array of sort fields
   */
  sortBy(fields: ComponentSortField[]): this {
    return this.setParam('s', fields);
  }

  /**
   * Set sort order
   * @param ascending - Whether to sort in ascending order
   */
  ascending(ascending = true): this {
    return this.setParam('asc', ascending ? 'true' : 'false');
  }

  /**
   * Set search strategy
   * @param strategy - Component tree search strategy
   */
  strategy(strategy: ComponentTreeStrategy): this {
    return this.setParam('strategy', strategy);
  }

  /**
   * Get only files
   */
  filesOnly(): this {
    return this.qualifiers([ComponentQualifier.File]);
  }

  /**
   * Get only directories
   */
  directoriesOnly(): this {
    return this.qualifiers([ComponentQualifier.Directory]);
  }

  /**
   * Get only projects
   */
  projectsOnly(): this {
    return this.qualifiers([ComponentQualifier.Project]);
  }

  /**
   * Get only test files
   */
  testFilesOnly(): this {
    return this.qualifiers([ComponentQualifier.TestFile]);
  }

  /**
   * Get only children (not grandchildren)
   */
  childrenOnly(): this {
    return this.strategy(ComponentTreeStrategy.Children);
  }

  /**
   * Get only leaves (files without children)
   */
  leavesOnly(): this {
    return this.strategy(ComponentTreeStrategy.Leaves);
  }

  /**
   * Get all descendants
   */
  allDescendants(): this {
    return this.strategy(ComponentTreeStrategy.All);
  }

  /**
   * Sort by name
   */
  sortByName(): this {
    return this.sortBy([ComponentSortField.Name]);
  }

  /**
   * Sort by path
   */
  sortByPath(): this {
    return this.sortBy([ComponentSortField.Path]);
  }

  /**
   * Sort by qualifier
   */
  sortByQualifier(): this {
    return this.sortBy([ComponentSortField.Qualifier]);
  }

  /**
   * Execute the request
   */
  async execute(): Promise<ComponentTreeResponse> {
    if (this.params.component === undefined || this.params.component === '') {
      throw new ValidationError(
        'Component parameter is required for tree search',
        'MISSING_COMPONENT'
      );
    }

    return this.executor(this.params as ComponentTreeRequest);
  }

  /**
   * Extract components array from response for pagination
   */
  protected getItems(response: ComponentTreeResponse): Component[] {
    return response.components;
  }
}
