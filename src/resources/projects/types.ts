/**
 * Types for the SonarQube Projects API
 */

/**
 * Visibility of a project
 */
export type ProjectVisibility = 'public' | 'private';

/**
 * Possible project qualifiers
 */
export type ProjectQualifier = 'TRK' | 'APP' | 'VW';

/**
 * Base project information
 */
export interface Project {
  key: string;
  name: string;
  qualifier: ProjectQualifier;
  visibility: ProjectVisibility;
  lastAnalysisDate?: string;
  revision?: string;
}

/**
 * Extended project information for search results
 */
export interface ProjectSearchResult extends Project {
  managed?: boolean;
  containsAiCode?: boolean;
}

/**
 * Request parameters for bulk_delete
 * @since 5.2
 */
export interface BulkDeleteProjectsRequest {
  analyzedBefore?: string;
  onProvisionedOnly?: boolean;
  projects?: string[];
  q?: string;
  qualifiers?: ProjectQualifier[];
}

/**
 * Request parameters for create
 * @since 4.0
 */
export interface CreateProjectRequest {
  mainBranch?: string;
  name: string;
  newCodeDefinitionType?: string;
  newCodeDefinitionValue?: string;
  project: string;
  visibility?: ProjectVisibility;
}

/**
 * Response from create
 */
export interface CreateProjectResponse {
  project: {
    key: string;
    name: string;
    qualifier: ProjectQualifier;
    visibility: ProjectVisibility;
  };
}

/**
 * Request parameters for delete
 * @since 5.2
 */
export interface DeleteProjectRequest {
  project: string;
}

/**
 * Request parameters for export_findings
 * @since 9.1
 */
export interface ExportFindingsRequest {
  project: string;
  branch?: string;
  pullRequest?: string;
}

/**
 * Finding type in export
 */
export type FindingType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Finding severity
 */
export type FindingSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';

/**
 * Finding status
 */
export type FindingStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';

/**
 * Response item from export_findings
 */
export interface Finding {
  key: string;
  type: FindingType;
  severity?: FindingSeverity;
  status: FindingStatus;
  component: string;
  line?: number;
  message: string;
  rule: string;
  effort?: string;
  debt?: string;
  tags?: string[];
  creationDate: string;
  updateDate?: string;
  closeDate?: string;
  author?: string;
  assignee?: string;
}

/**
 * Request parameters for get_contains_ai_code
 * @since 2025.1
 */
export interface GetContainsAiCodeRequest {
  project: string;
}

/**
 * Response from get_contains_ai_code
 */
export interface GetContainsAiCodeResponse {
  containsAiCode: boolean;
}

/**
 * Response from license_usage
 * @since 9.4
 */
export interface LicenseUsageResponse {
  projects: Array<{
    key: string;
    name: string;
    lastAnalysisDate?: string;
    linesOfCode: number;
  }>;
}

/**
 * Request parameters for search
 * @since 6.3
 */
export interface SearchProjectsRequest {
  analyzedBefore?: string;
  onProvisionedOnly?: boolean;
  organization?: string;
  p?: number;
  projects?: string[];
  ps?: number;
  q?: string;
  qualifiers?: ProjectQualifier[];
}

/**
 * Response from search
 */
export interface SearchProjectsResponse {
  components: ProjectSearchResult[];
  facets?: Array<{
    property: string;
    values: Array<{
      val: string;
      count: number;
    }>;
  }>;
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Request parameters for set_contains_ai_code
 * @since 10.8
 */
export interface SetContainsAiCodeRequest {
  containsAiCode: boolean;
  project: string;
}

/**
 * Request parameters for bulk_update_key
 * @since 6.1
 * @deprecated Since 7.6
 */
export interface BulkUpdateProjectKeyRequest {
  project: string;
  from: string;
  to: string;
  dryRun?: boolean;
}

/**
 * Response from bulk_update_key
 */
export interface BulkUpdateProjectKeyResponse {
  keys: Array<{
    key: string;
    newKey: string;
    duplicate: boolean;
  }>;
}

/**
 * Request parameters for update_key
 * @since 6.1
 */
export interface UpdateProjectKeyRequest {
  from: string;
  to: string;
}

/**
 * Request parameters for update_visibility
 * @since 6.4
 */
export interface UpdateProjectVisibilityRequest {
  project: string;
  visibility: ProjectVisibility;
}
