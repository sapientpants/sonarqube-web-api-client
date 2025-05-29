/**
 * Types for the SonarQube Users API
 */

/**
 * Base user information
 */
export interface User {
  login: string;
  name: string;
  avatar?: string;
  active: boolean;
}

/**
 * Extended user information available to authenticated users
 */
export interface UserWithDetails extends User {
  email?: string;
  externalIdentity?: string;
  externalProvider?: string;
  groups?: string[];
  lastConnectionDate?: string;
  tokensCount?: number;
}

/**
 * User group information
 */
export interface UserGroup {
  name: string;
  description?: string;
  default?: boolean;
  selected?: boolean;
}

/**
 * Selection filter for groups
 */
export type GroupSelectionFilter = 'all' | 'deselected' | 'selected';

/**
 * Request parameters for search
 * @since 2.10
 * @deprecated Since 10.8 (February 10, 2025). Use GET api/v2/users/search instead. Will be dropped August 13th 2025.
 */
export interface SearchUsersRequest {
  ids?: string[];
  p?: number;
  ps?: number;
  q?: string;
}

/**
 * Response from search
 * @deprecated Since 10.8 (February 10, 2025). Use GET api/v2/users/search instead. Will be dropped August 13th 2025.
 */
export interface SearchUsersResponse {
  users: UserWithDetails[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Request parameters for groups
 * @since 5.2
 */
export interface GetUserGroupsRequest {
  login: string;
  organization: string;
  p?: number;
  ps?: number;
  q?: string;
  selected?: GroupSelectionFilter;
}

/**
 * Response from groups
 */
export interface GetUserGroupsResponse {
  groups: UserGroup[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

// ============================================================================
// V2 API TYPES
// ============================================================================

/**
 * Request parameters for v2 users search
 * @since 10.8
 */
export interface SearchUsersV2Request {
  /** User IDs to filter by */
  ids?: string[];
  /** Page number (1-based) */
  page?: number;
  /** Page size (max 500) */
  pageSize?: number;
  /** Search query for login, name, or email */
  query?: string;
  /** Filter by active status */
  active?: boolean;
  /** Include external provider information */
  includeExternalProvider?: boolean;
}

/**
 * V2 User information with enhanced details
 * @since 10.8
 */
export interface UserV2 {
  /** Unique user identifier */
  id: string;
  /** User login name */
  login: string;
  /** Display name */
  name: string;
  /** Email address */
  email?: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether the user is active */
  active: boolean;
  /** Whether the user is a local user */
  local: boolean;
  /** External identity information */
  externalProvider?: string;
  /** External identity */
  externalIdentity?: string;
  /** User groups */
  groups?: UserGroup[];
  /** Last connection timestamp */
  lastConnectionDate?: string;
  /** Number of tokens */
  tokensCount?: number;
  /** Creation date */
  createdAt?: string;
  /** Last update date */
  updatedAt?: string;
}

/**
 * Response from v2 users search
 * @since 10.8
 */
export interface SearchUsersV2Response {
  /** List of users */
  users: UserV2[];
  /** Pagination information */
  page: {
    /** Current page number (1-based) */
    pageIndex: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items */
    totalItems: number;
    /** Total number of pages */
    totalPages: number;
  };
}
