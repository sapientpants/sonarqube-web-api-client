/**
 * Types for the SonarQube User Groups API
 */

/**
 * User group information
 */
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  membersCount?: number;
  default?: boolean;
}

/**
 * User information with membership status
 */
export interface UserWithMembership {
  login: string;
  name: string;
  selected: boolean;
}

/**
 * Parameters for adding a user to a group
 * 'id' or 'name' must be provided
 * @since API 5.2
 */
export interface AddUserRequest {
  id?: string;
  name?: string;
  login?: string;
  organization?: string;
}

/**
 * Parameters for creating a new group
 * @since API 5.2
 */
export interface CreateGroupRequest {
  name: string;
  description?: string;
  organization: string;
}

/**
 * Response from creating a new group
 */
export interface CreateGroupResponse {
  group: UserGroup;
}

/**
 * Parameters for deleting a group
 * 'id' or 'name' must be provided
 * @since API 5.2
 */
export interface DeleteGroupRequest {
  id?: string;
  name?: string;
  organization?: string;
}

/**
 * Parameters for removing a user from a group
 * 'id' or 'name' must be provided
 * @since API 5.2
 */
export interface RemoveUserRequest {
  id?: string;
  name?: string;
  login?: string;
  organization?: string;
}

/**
 * Parameters for searching user groups
 * @since API 5.2
 */
export interface SearchGroupsRequest {
  f?: Array<'name' | 'description' | 'membersCount'>;
  organization: string;
  p?: number;
  ps?: number;
  q?: string;
}

/**
 * Response from searching user groups
 */
export interface SearchGroupsResponse {
  groups: UserGroup[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Parameters for updating a group
 * @since API 5.2
 */
export interface UpdateGroupRequest {
  id: string;
  name?: string;
  description?: string;
}

/**
 * Parameters for searching users with membership information
 * 'id' or 'name' must be provided
 * @since API 5.2
 */
export interface UsersRequest {
  id?: string;
  name?: string;
  organization?: string;
  p?: number;
  ps?: number;
  q?: string;
  selected?: 'all' | 'deselected' | 'selected';
}

/**
 * Response from searching users with membership information
 */
export interface UsersResponse {
  p: number;
  ps: number;
  total: number;
  users: UserWithMembership[];
  paging?: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}
