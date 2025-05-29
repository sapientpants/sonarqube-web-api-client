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
