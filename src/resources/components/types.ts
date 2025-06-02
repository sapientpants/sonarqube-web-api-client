/**
 * Types for the SonarQube Components API
 */

import type { PaginatedRequest, PaginatedResponse } from '../../core/builders';

/**
 * Component qualifiers
 */
export enum ComponentQualifier {
  /** Sub-projects */
  SubProject = 'BRC',
  /** Directories */
  Directory = 'DIR',
  /** Files */
  File = 'FIL',
  /** Projects */
  Project = 'TRK',
  /** Test Files */
  TestFile = 'UTS',
}

/**
 * Component tree search strategy
 */
export enum ComponentTreeStrategy {
  /** Return all the descendants components of the base component */
  All = 'all',
  /** Return the children components of the base component */
  Children = 'children',
  /** Return all the descendant components which don't have other children */
  Leaves = 'leaves',
}

/**
 * Component sort fields
 */
export enum ComponentSortField {
  /** Sort by name */
  Name = 'name',
  /** Sort by path */
  Path = 'path',
  /** Sort by qualifier */
  Qualifier = 'qualifier',
}

/**
 * Boolean values that can be strings
 */
export type BooleanString = 'true' | 'false' | 'yes' | 'no';

/**
 * Component entity
 */
export interface Component {
  /** Component key */
  key: string;
  /** Component name */
  name: string;
  /** Component qualifier */
  qualifier: ComponentQualifier;
  /** Component path (optional) */
  path?: string;
  /** Component language (for files) */
  language?: string;
  /** Component description */
  description?: string;
  /** Whether component is enabled */
  enabled?: boolean;
  /** Tags associated with the component */
  tags?: string[];
  /** Visibility of the component */
  visibility?: 'public' | 'private';
}

/**
 * Request parameters for components/show
 * @since 5.4
 */
export interface ComponentShowRequest {
  /** Component key */
  component: string;
  /** Branch key */
  branch?: string;
  /** Pull request id */
  pullRequest?: string;
}

/**
 * Response from components/show
 */
export interface ComponentShowResponse {
  /** The requested component */
  component: Component;
  /** Ancestors of the component, ordered from parent to root project */
  ancestors?: Component[];
}

/**
 * Request parameters for components/search
 * @since 6.3
 * @deprecated Use components/tree instead
 */
export interface ComponentSearchRequest extends PaginatedRequest {
  /** Organization key */
  organization: string;
  /** Search query */
  q?: string;
}

/**
 * Modern request parameters for component search using tree API
 * This provides a flexible search across components without requiring a base component
 */
export interface ComponentGlobalSearchRequest extends PaginatedRequest {
  /** Search query */
  q?: string;
  /** Component qualifiers filter */
  qualifiers?: ComponentQualifier[];
  /** Languages filter */
  languages?: string[];
  /** Organization key (SonarCloud only) */
  organization?: string;
}

/**
 * Response from components/search
 * @deprecated Use components/tree instead
 */
export interface ComponentSearchResponse extends PaginatedResponse {
  /** Found components */
  components: Component[];
}

/**
 * Request parameters for components/tree
 * @since 5.4
 */
export interface ComponentTreeRequest extends PaginatedRequest {
  /** Base component key */
  component: string;
  /** Branch key */
  branch?: string;
  /** Pull request id */
  pullRequest?: string;
  /** Search query (minimum 3 characters) */
  q?: string;
  /** Component qualifiers filter */
  qualifiers?: ComponentQualifier[];
  /** Sort fields */
  s?: ComponentSortField[];
  /** Ascending sort */
  asc?: BooleanString;
  /** Search strategy */
  strategy?: ComponentTreeStrategy;
}

/**
 * Response from components/tree
 */
export interface ComponentTreeResponse extends PaginatedResponse {
  /** Base component */
  baseComponent: Component;
  /** Found components */
  components: Component[];
}
