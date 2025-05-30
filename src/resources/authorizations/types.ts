/**
 * Types for SonarQube Authorizations API v2
 * @since 10.5
 */

import type { V2Resource, V2SearchParams } from '../../core/types/v2-common';

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
