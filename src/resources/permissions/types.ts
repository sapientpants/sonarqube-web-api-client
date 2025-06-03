/**
 * Types for the SonarQube Permissions API
 *
 * Manages permission templates, and the granting and revoking of permissions
 * at the global and project levels.
 */

/**
 * Global permission types
 */
export type GlobalPermission =
  | 'admin' // System administration
  | 'profileadmin' // Quality profile administration
  | 'gateadmin' // Quality gate administration
  | 'scan' // Execute analysis
  | 'provisioning'; // Create projects

/**
 * Project permission types
 */
export type ProjectPermission =
  | 'admin' // Project administration
  | 'codeviewer' // Browse project code
  | 'issueadmin' // Administer issues
  | 'securityhotspotadmin' // Administer security hotspots
  | 'scan' // Execute analysis
  | 'user'; // Access project

/**
 * Union of all permission types
 */
export type Permission = GlobalPermission | ProjectPermission;

/**
 * Base parameters for permission operations
 */
export interface BasePermissionParams {
  /** Key of organization, used when group name is set */
  organization?: string;
}

/**
 * Base parameters for project-scoped permission operations
 */
export interface ProjectPermissionParams extends BasePermissionParams {
  /** Project id */
  projectId?: string;
  /** Project key */
  projectKey?: string;
}

/**
 * Base parameters for template operations
 */
export interface TemplateParams extends BasePermissionParams {
  /** Template id */
  templateId?: string;
  /** Template name */
  templateName?: string;
}

// ============================================================================
// USER PERMISSION OPERATIONS
// ============================================================================

/**
 * Parameters for adding permission to a user
 */
export interface AddUserPermissionRequest extends ProjectPermissionParams {
  /** User login */
  login: string;
  /** Permission to add */
  permission: Permission;
  /** Required when adding permissions */
  organization: string;
}

/**
 * Parameters for removing permission from a user
 */
export interface RemoveUserPermissionRequest extends ProjectPermissionParams {
  /** User login */
  login: string;
  /** Permission to remove */
  permission: Permission;
  /** Required when removing permissions */
  organization: string;
}

/**
 * Parameters for adding user to permission template
 */
export interface AddUserToTemplateRequest extends TemplateParams {
  /** User login */
  login: string;
  /** Permission to grant in template */
  permission: ProjectPermission;
}

/**
 * Parameters for removing user from permission template
 */
export interface RemoveUserFromTemplateRequest extends TemplateParams {
  /** User login */
  login: string;
  /** Permission to revoke from template */
  permission: ProjectPermission;
}

// ============================================================================
// GROUP PERMISSION OPERATIONS
// ============================================================================

/**
 * Parameters for adding permission to a group
 */
export interface AddGroupPermissionRequest extends ProjectPermissionParams {
  /** Group name or 'anyone' (case insensitive) */
  groupName?: string;
  /** Group id (deprecated - use groupName and organization instead) */
  groupId?: string;
  /** Permission to add */
  permission: Permission;
}

/**
 * Parameters for removing permission from a group
 */
export interface RemoveGroupPermissionRequest extends ProjectPermissionParams {
  /** Group name or 'anyone' (case insensitive) */
  groupName?: string;
  /** Group id (deprecated - use groupName and organization instead) */
  groupId?: string;
  /** Permission to remove */
  permission: Permission;
}

/**
 * Parameters for adding group to permission template
 */
export interface AddGroupToTemplateRequest extends TemplateParams {
  /** Group name or 'anyone' (case insensitive) */
  groupName?: string;
  /** Group id (deprecated - use groupName and organization instead) */
  groupId?: string;
  /** Permission to grant in template */
  permission: ProjectPermission;
}

/**
 * Parameters for removing group from permission template
 */
export interface RemoveGroupFromTemplateRequest extends TemplateParams {
  /** Group name or 'anyone' (case insensitive) */
  groupName?: string;
  /** Group id (deprecated - use groupName and organization instead) */
  groupId?: string;
  /** Permission to revoke from template */
  permission: ProjectPermission;
}

// ============================================================================
// PROJECT CREATOR OPERATIONS
// ============================================================================

/**
 * Parameters for adding project creator to permission template
 */
export interface AddProjectCreatorToTemplateRequest extends TemplateParams {
  /** Permission to grant to project creators */
  permission: ProjectPermission;
}

/**
 * Parameters for removing project creator from permission template
 */
export interface RemoveProjectCreatorFromTemplateRequest extends TemplateParams {
  /** Permission to revoke from project creators */
  permission: ProjectPermission;
}

// ============================================================================
// TEMPLATE MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Parameters for creating a permission template
 */
export interface CreateTemplateRequest extends BasePermissionParams {
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Project key pattern (Java regex) */
  projectKeyPattern?: string;
}

/**
 * Parameters for updating a permission template
 */
export interface UpdateTemplateRequest extends BasePermissionParams {
  /** Template id */
  id: string;
  /** Template name */
  name?: string;
  /** Template description */
  description?: string;
  /** Project key pattern (Java regex) */
  projectKeyPattern?: string;
}

/**
 * Parameters for deleting a permission template
 */
export interface DeleteTemplateRequest extends BasePermissionParams {
  /** Template id */
  templateId?: string;
  /** Template name */
  templateName?: string;
}

/**
 * Parameters for applying template to one project
 */
export interface ApplyTemplateRequest extends BasePermissionParams {
  /** Project id */
  projectId?: string;
  /** Project key */
  projectKey?: string;
  /** Template id */
  templateId?: string;
  /** Template name */
  templateName?: string;
}

/**
 * Parameters for applying template to multiple projects
 */
export interface BulkApplyTemplateRequest extends BasePermissionParams {
  /** Template id */
  templateId?: string;
  /** Template name */
  templateName?: string;
  /** Filter for projects by analyzed before date */
  analyzedBefore?: string;
  /** Filter for projects on provisioned only */
  onProvisionedOnly?: boolean;
  /** Filter for projects by keys (comma-separated, max 1000) */
  projects?: string[];
  /** Search query for projects */
  q?: string;
  /** Qualifier filter (TRK for projects) */
  qualifiers?: string;
}

/**
 * Parameters for setting default template
 */
export interface SetDefaultTemplateRequest extends BasePermissionParams {
  /** Template id */
  templateId?: string;
  /** Template name */
  templateName?: string;
  /** Qualifier (TRK for projects) */
  qualifier?: string;
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

/**
 * Parameters for searching global permissions
 * @deprecated Since 6.5
 */
export interface SearchGlobalPermissionsRequest extends BasePermissionParams {
  /** Required organization key */
  organization: string;
}

/**
 * Parameters for searching project permissions
 * @deprecated Since 6.5
 */
export interface SearchProjectPermissionsRequest extends BasePermissionParams {
  /** Project id */
  projectId?: string;
  /** Project key */
  projectKey?: string;
  /** Page number (default: 1) */
  p?: number;
  /** Page size (default: 25) */
  ps?: number;
  /** Search query */
  q?: string;
}

/**
 * Parameters for searching permission templates
 */
export interface SearchTemplatesRequest extends BasePermissionParams {
  /** Search query */
  q?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Permission template information
 */
export interface PermissionTemplate {
  /** Template id */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Project key pattern */
  projectKeyPattern?: string;
  /** Creation date */
  createdAt: string;
  /** Last update date */
  updatedAt: string;
  /** Permissions granted to users */
  permissions?: TemplatePermission[];
}

/**
 * Permission details in a template
 */
export interface TemplatePermission {
  /** Permission key */
  key: ProjectPermission;
  /** Users with this permission */
  usersCount?: number;
  /** Groups with this permission */
  groupsCount?: number;
  /** Whether project creators get this permission */
  withProjectCreator?: boolean;
}

/**
 * User permission information
 */
export interface UserPermission {
  /** User login */
  login: string;
  /** User name */
  name: string;
  /** User email */
  email?: string;
  /** Permissions granted to this user */
  permissions: Permission[];
}

/**
 * Group permission information
 */
export interface GroupPermission {
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Permissions granted to this group */
  permissions: Permission[];
}

/**
 * Response for creating a permission template
 */
export interface CreateTemplateResponse {
  /** Created permission template */
  permissionTemplate: PermissionTemplate;
}

/**
 * Response for updating a permission template
 */
export interface UpdateTemplateResponse {
  /** Updated permission template */
  permissionTemplate: PermissionTemplate;
}

/**
 * Response for searching project permissions
 * @deprecated Since 6.5
 */
export interface SearchProjectPermissionsResponse {
  /** Pagination information */
  paging: {
    /** Page index */
    pageIndex: number;
    /** Page size */
    pageSize: number;
    /** Total count */
    total: number;
  };
  /** List of users with permissions */
  users: UserPermission[];
  /** List of groups with permissions */
  groups: GroupPermission[];
}

/**
 * Response for searching permission templates
 */
export interface SearchTemplatesResponse {
  /** List of permission templates */
  permissionTemplates: PermissionTemplate[];
  /** Default permission templates by qualifier */
  defaultTemplates: Array<{
    /** Template id */
    templateId: string;
    /** Qualifier (e.g., 'TRK' for projects) */
    qualifier: string;
  }>;
}

// ============================================================================
// GLOBAL PERMISSION SEARCH OPERATIONS
// ============================================================================

/**
 * Parameters for searching global permissions
 */
export interface SearchGlobalPermissionsRequest extends BasePermissionParams {
  /** Query string to filter permissions */
  q?: string;
  /** Page number (1-based) */
  p?: number;
  /** Page size (max 500) */
  ps?: number;
}

/**
 * Permission entry in search results
 */
export interface PermissionEntry {
  /** Permission key */
  key: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Users with this permission */
  usersCount?: number;
  /** Groups with this permission */
  groupsCount?: number;
}

/**
 * Response from global permissions search
 * @deprecated Since 6.5
 */
export interface SearchGlobalPermissionsResponse {
  /** Pagination information */
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  /** List of permissions */
  permissions: PermissionEntry[];
}
