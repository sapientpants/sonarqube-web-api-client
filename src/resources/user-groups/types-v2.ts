/**
 * Types for SonarQube User Groups API v2
 * @since 10.4/10.5
 */

import type { V2Resource, V2SearchParams, V2AuditFields } from '../../core/types/v2-common';

/**
 * User group v2 model
 */
export interface UserGroupV2 extends V2Resource, V2AuditFields {
  /**
   * Group name (unique)
   */
  name: string;

  /**
   * Group description
   */
  description?: string;

  /**
   * Whether this is a default group
   */
  default: boolean;

  /**
   * Number of members in the group
   */
  membersCount: number;

  /**
   * Associated permissions count
   */
  permissionsCount?: number;

  /**
   * Whether the group is managed externally (LDAP, SAML, etc.)
   */
  managed: boolean;

  /**
   * External provider identifier
   */
  externalProvider?: string;

  /**
   * External group identifier
   */
  externalId?: string;
}

/**
 * Request parameters for searching user groups (v2)
 */
export interface SearchUserGroupsV2Request extends V2SearchParams {
  /**
   * Search query (searches in name and description)
   */
  query?: string;

  /**
   * Filter by managed status
   */
  managed?: boolean;

  /**
   * Include default groups
   */
  includeDefault?: boolean;

  /**
   * Filter by external provider
   */
  externalProvider?: string;

  /**
   * Include permission counts
   */
  includePermissions?: boolean;

  /**
   * Minimum number of members
   */
  minMembers?: number;

  /**
   * Maximum number of members
   */
  maxMembers?: number;
}

/**
 * Response from user group search (v2)
 */
export interface SearchUserGroupsV2Response {
  /**
   * List of user groups
   */
  userGroups: UserGroupV2[];

  /**
   * Pagination information
   */
  page: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Request to create a user group (v2)
 */
export interface CreateUserGroupV2Request {
  /**
   * Group name (required, unique)
   */
  name: string;

  /**
   * Group description
   */
  description?: string;

  /**
   * Set as default group
   */
  default?: boolean;
}

/**
 * Request to update a user group (v2)
 */
export interface UpdateUserGroupV2Request {
  /**
   * New group name
   */
  name?: string;

  /**
   * New description
   */
  description?: string;

  /**
   * Update default status
   */
  default?: boolean;
}

/**
 * User group member (v2)
 */
export interface UserGroupMemberV2 {
  /**
   * User ID (UUID)
   */
  userId: string;

  /**
   * User login
   */
  login: string;

  /**
   * User name
   */
  name: string;

  /**
   * User email
   */
  email?: string;

  /**
   * Whether user is active
   */
  active: boolean;

  /**
   * Whether user is managed externally
   */
  managed: boolean;

  /**
   * When the user was added to the group (ISO 8601)
   */
  addedAt: string;
}

/**
 * Request to add users to a group (v2)
 */
export interface AddUsersToGroupV2Request {
  /**
   * User IDs to add
   */
  userIds: string[];
}

/**
 * Request to remove users from a group (v2)
 */
export interface RemoveUsersFromGroupV2Request {
  /**
   * User IDs to remove
   */
  userIds: string[];
}

/**
 * Response for group membership operations (v2)
 */
export interface GroupMembershipV2Response {
  /**
   * Number of users successfully added/removed
   */
  successful: number;

  /**
   * Number of failures
   */
  failed: number;

  /**
   * Details of failures
   */
  failures?: Array<{
    userId: string;
    reason: string;
  }>;
}

/**
 * Request parameters for searching group members (v2)
 */
export interface SearchGroupMembersV2Request extends V2SearchParams {
  /**
   * Group ID
   */
  groupId: string;

  /**
   * Search query (searches in login, name, email)
   */
  query?: string;

  /**
   * Filter by active status
   */
  active?: boolean;

  /**
   * Filter by managed status
   */
  managed?: boolean;
}

/**
 * Response from group members search (v2)
 */
export interface SearchGroupMembersV2Response {
  /**
   * List of group members
   */
  members: UserGroupMemberV2[];

  /**
   * Pagination information
   */
  page: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}
