/**
 * Types for SonarQube Authorizations API v2
 * @since 10.5
 */

import type { V2Resource, V2SearchParams, V2AuditFields } from '../../core/types/v2-common.js';

/**
 * Permission types in v2
 */
export type PermissionTypeV2 =
  | 'admin'
  | 'profileadmin'
  | 'gateadmin'
  | 'scan'
  | 'provisioning'
  | 'applicationcreator'
  | 'portfoliocreator'
  | 'codeviewer'
  | 'issueadmin'
  | 'securityhotspotadmin'
  | 'user'
  | 'browse';

/**
 * Permission scope
 */
export type PermissionScope = 'global' | 'project' | 'portfolio' | 'application';

/**
 * Permission v2 model
 */
export interface PermissionV2 extends V2Resource {
  /**
   * Permission type
   */
  permission: PermissionTypeV2;

  /**
   * Permission scope
   */
  scope: PermissionScope;

  /**
   * Resource ID (for non-global permissions)
   */
  resourceId?: string;

  /**
   * Resource key (for non-global permissions)
   */
  resourceKey?: string;

  /**
   * Resource name (for non-global permissions)
   */
  resourceName?: string;

  /**
   * User ID (if user permission)
   */
  userId?: string;

  /**
   * User login (if user permission)
   */
  userLogin?: string;

  /**
   * Group ID (if group permission)
   */
  groupId?: string;

  /**
   * Group name (if group permission)
   */
  groupName?: string;

  /**
   * Whether this permission is inherited
   */
  inherited?: boolean;

  /**
   * Template ID (if from template)
   */
  templateId?: string;
}

/**
 * Request to get group permissions (v2)
 */
export interface GetGroupPermissionsV2Request extends V2SearchParams {
  /**
   * Filter by group IDs
   */
  groupIds?: string[];

  /**
   * Filter by group names
   */
  groupNames?: string[];

  /**
   * Filter by permission types
   */
  permissions?: PermissionTypeV2[];

  /**
   * Filter by scope
   */
  scope?: PermissionScope;

  /**
   * Filter by resource ID
   */
  resourceId?: string;

  /**
   * Filter by resource key
   */
  resourceKey?: string;

  /**
   * Include inherited permissions
   */
  includeInherited?: boolean;
}

/**
 * Response for group permissions (v2)
 */
export interface GetGroupPermissionsV2Response {
  /**
   * List of permissions
   */
  permissions: PermissionV2[];

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
 * Request to get user permissions (v2)
 */
export interface GetUserPermissionsV2Request extends V2SearchParams {
  /**
   * Filter by user IDs
   */
  userIds?: string[];

  /**
   * Filter by user logins
   */
  userLogins?: string[];

  /**
   * Filter by permission types
   */
  permissions?: PermissionTypeV2[];

  /**
   * Filter by scope
   */
  scope?: PermissionScope;

  /**
   * Filter by resource ID
   */
  resourceId?: string;

  /**
   * Filter by resource key
   */
  resourceKey?: string;

  /**
   * Include group-based permissions
   */
  includeGroups?: boolean;

  /**
   * Include inherited permissions
   */
  includeInherited?: boolean;
}

/**
 * Response for user permissions (v2)
 */
export interface GetUserPermissionsV2Response {
  /**
   * List of permissions
   */
  permissions: PermissionV2[];

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
 * Request to grant a permission (v2)
 */
export interface GrantPermissionV2Request {
  /**
   * Permission to grant
   */
  permission: PermissionTypeV2;

  /**
   * User ID (required if not group)
   */
  userId?: string;

  /**
   * Group ID (required if not user)
   */
  groupId?: string;

  /**
   * Resource ID (for project/portfolio/application permissions)
   */
  resourceId?: string;

  /**
   * Template ID (to apply template)
   */
  templateId?: string;
}

/**
 * Permission template v2
 */
export interface PermissionTemplateV2 extends V2Resource {
  /**
   * Template name
   */
  name: string;

  /**
   * Template description
   */
  description?: string;

  /**
   * Whether this is the default template
   */
  default: boolean;

  /**
   * Pattern for automatic association
   */
  projectKeyPattern?: string;

  /**
   * Permissions in this template
   */
  permissions: Array<{
    permission: PermissionTypeV2;
    usersCount: number;
    groupsCount: number;
    withProjectCreator?: boolean;
  }>;
}

/**
 * Request to search permission templates (v2)
 */
export interface SearchPermissionTemplatesV2Request extends V2SearchParams {
  /**
   * Search query
   */
  query?: string;

  /**
   * Include permission details
   */
  includePermissions?: boolean;
}

/**
 * Response for permission template search (v2)
 */
export interface SearchPermissionTemplatesV2Response {
  /**
   * List of templates
   */
  templates: PermissionTemplateV2[];

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
 * Effective permissions for a user/group on a resource
 */
export interface EffectivePermissionsV2 {
  /**
   * Direct permissions
   */
  direct: PermissionTypeV2[];

  /**
   * Inherited permissions
   */
  inherited: PermissionTypeV2[];

  /**
   * Group-based permissions (for users)
   */
  fromGroups?: Array<{
    groupId: string;
    groupName: string;
    permissions: PermissionTypeV2[];
  }>;

  /**
   * All effective permissions (combined)
   */
  effective: PermissionTypeV2[];
}

// ============================================================================
// GROUP MANAGEMENT TYPES (moved from user-groups/types-v2.ts)
// ============================================================================

/**
 * Group v2 model (renamed from UserGroupV2)
 */
export interface GroupV2 extends V2Resource, V2AuditFields {
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
 * Request parameters for searching groups (v2)
 */
export interface SearchGroupsV2Request extends V2SearchParams {
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
 * Response from group search (v2)
 */
export interface SearchGroupsV2Response {
  /**
   * List of groups
   */
  groups: GroupV2[];

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
 * Request to create a group (v2)
 */
export interface CreateGroupV2Request {
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
 * Request to update a group (v2)
 */
export interface UpdateGroupV2Request {
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
 * Group member (v2)
 */
export interface GroupMemberV2 {
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
 * Group membership v2 model
 */
export interface GroupMembershipV2 extends V2Resource {
  /**
   * Group ID
   */
  groupId: string;

  /**
   * Group name
   */
  groupName: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * User login
   */
  userLogin: string;

  /**
   * When the membership was created
   */
  createdAt: string;
}

/**
 * Request to add a group membership (v2)
 */
export interface AddGroupMembershipV2Request {
  /**
   * Group ID
   */
  groupId: string;

  /**
   * User ID
   */
  userId: string;
}

/**
 * Request parameters for searching group memberships (v2)
 */
export interface SearchGroupMembershipsV2Request extends V2SearchParams {
  /**
   * Filter by group IDs
   */
  groupIds?: string[];

  /**
   * Filter by user IDs
   */
  userIds?: string[];

  /**
   * Search query
   */
  query?: string;
}

/**
 * Response from group memberships search (v2)
 */
export interface SearchGroupMembershipsV2Response {
  /**
   * List of group memberships
   */
  memberships: GroupMembershipV2[];

  /**
   * Pagination information
   */
  page: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}
