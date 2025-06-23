/**
 * Issues API types
 */

import type { PaginatedRequest, PaginatedResponse } from '../../core/builders';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';

/**
 * Issue status values
 */
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';

/**
 * Issue type categories
 */
export type IssueType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Issue resolution values
 */
export type IssueResolution = 'FALSE-POSITIVE' | 'WONTFIX' | 'FIXED' | 'REMOVED';

/**
 * Issue workflow transitions
 */
export type IssueTransition =
  | 'confirm'
  | 'unconfirm'
  | 'reopen'
  | 'resolve'
  | 'falsepositive'
  | 'wontfix'
  | 'close';

/**
 * Text range within a file
 */
export interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Issue location information
 */
export interface IssueLocation {
  component: string;
  textRange?: TextRange;
  msg?: string;
}

/**
 * Issue flow for vulnerability analysis
 */
export interface IssueFlow {
  locations: IssueLocation[];
}

/**
 * Issue comment
 */
export interface IssueComment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

/**
 * Core Issue entity
 */
export interface Issue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows?: IssueFlow[];
  status: IssueStatus;
  message: string;
  effort?: string;
  debt?: string;
  assignee?: string;
  author?: string;
  tags: string[];
  transitions?: IssueTransition[];
  actions?: string[];
  comments?: IssueComment[];
  creationDate: string;
  updateDate: string;
  closeDate?: string;
  type: IssueType;
  resolution?: IssueResolution;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  impacts?: Array<{
    softwareQuality: string;
    severity: string;
  }>;
}

/**
 * Impact severity levels (for new Clean Code taxonomy)
 */
export type ImpactSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Software quality impact categories (for new Clean Code taxonomy)
 */
export type ImpactSoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';

/**
 * Clean Code attribute categories
 */
export type CleanCodeAttributeCategory = 'ADAPTABLE' | 'CONSISTENT' | 'INTENTIONAL' | 'RESPONSIBLE';

/**
 * New issue status values (replacing deprecated statuses)
 */
export type IssueStatusNew = 'OPEN' | 'CONFIRMED' | 'RESOLVED' | 'REOPENED' | 'CLOSED';

/**
 * Facet mode for aggregations
 */
export type FacetMode = 'effort' | 'count';

/**
 * Issue scope values
 */
export type IssueScope = 'MAIN' | 'TEST' | 'OVERALL';

/**
 * Request to search for issues
 */
export interface SearchIssuesRequest extends PaginatedRequest {
  additionalFields?: string[];
  asc?: boolean;
  assigned?: boolean;
  assignees?: string[];
  author?: string;
  authors?: string[];
  branch?: string;
  casa?: string[]; // since 10.7
  cleanCodeAttributeCategories?: CleanCodeAttributeCategory[];
  codeVariants?: string[]; // since 10.1
  componentKeys?: string[];
  components?: string[];
  createdAfter?: string;
  createdAt?: string;
  createdBefore?: string;
  createdInLast?: string;
  cwe?: string[];
  directories?: string[];
  facetMode?: FacetMode;
  facets?: string[];
  files?: string[];
  fixedInPullRequest?: string; // since 10.4
  impactSeverities?: ImpactSeverity[];
  impactSoftwareQualities?: ImpactSoftwareQuality[];
  inNewCodePeriod?: boolean;
  issueStatuses?: IssueStatusNew[];
  issues?: string[];
  languages?: string[];
  onComponentOnly?: boolean;
  organization?: string;
  owaspAsvs40?: string[]; // Maps to 'owaspAsvs-4.0' in API, since 9.7
  owaspAsvsLevel?: 1 | 2 | 3; // since 9.7
  owaspMobileTop102024?: string[]; // Maps to 'owaspMobileTop10-2024' in API, since 2025.3
  owaspTop10?: string[];
  owaspTop10v2021?: string[]; // Maps to 'owaspTop10-2021' in API
  pciDss32?: string[]; // Maps to 'pciDss-3.2' in API, since 9.6
  pciDss40?: string[]; // Maps to 'pciDss-4.0' in API, since 9.6
  prioritizedRule?: boolean;
  projects?: string[];
  pullRequest?: string;
  resolutions?: IssueResolution[]; // deprecated
  resolved?: boolean;
  rules?: string[];
  s?: string; // sort field
  sansTop25?: string[];
  scopes?: IssueScope[];
  severities?: IssueSeverity[]; // deprecated
  sinceLeakPeriod?: boolean;
  sonarsourceSecurity?: string[];
  sonarsourceSecurityCategory?: string[];
  statuses?: IssueStatus[]; // deprecated
  stigASDV5R3?: string[]; // Maps to 'stig-ASD_V5R3' in API, since 10.7
  tags?: string[];
  timeZone?: string; // since 8.6
  types?: IssueType[]; // deprecated
}

/**
 * Response from searching issues
 */
export interface SearchIssuesResponse extends PaginatedResponse {
  issues: Issue[];
  components?: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules?: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
  users?: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  languages?: Array<{
    key: string;
    name: string;
  }>;
  facets?: Array<{
    property: string;
    values: Array<{
      val: string;
      count: number;
    }>;
  }>;
}

/**
 * Request to add a comment to an issue
 */
export interface AddCommentRequest {
  issue: string;
  text: string;
  isFeedback?: boolean;
}

/**
 * Response from adding a comment
 */
export interface AddCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to assign an issue
 */
export interface AssignIssueRequest {
  issue: string;
  assignee?: string;
}

/**
 * Response from assigning an issue
 */
export interface AssignIssueResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to perform a workflow transition on an issue
 */
export interface DoTransitionRequest {
  issue: string;
  transition: IssueTransition;
}

/**
 * Response from performing a transition
 */
export interface DoTransitionResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to set tags on an issue
 */
export interface SetTagsRequest {
  issue: string;
  tags: string[];
}

/**
 * Response from setting tags
 */
export interface SetTagsResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to search for SCM authors
 */
export interface SearchAuthorsRequest {
  q?: string;
  ps?: number;
  project?: string;
}

/**
 * Response from searching authors
 */
export interface SearchAuthorsResponse {
  authors: string[];
}

/**
 * Request to perform bulk changes on issues
 */
export interface BulkChangeRequest {
  issues: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  add_tags?: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  remove_tags?: string[];
  assign?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set_severity?: IssueSeverity;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set_type?: IssueType;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  do_transition?: IssueTransition;
  comment?: string;
  sendNotifications?: boolean;
}

/**
 * Response from bulk change operation
 */
export interface BulkChangeResponse {
  total: number;
  success: number;
  ignored: number;
  failures: number;
  issues: Issue[];
}

/**
 * Request to get issue changelog
 */
export interface GetChangelogRequest {
  issue: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  user: string;
  userName: string;
  creationDate: string;
  diffs: Array<{
    key: string;
    newValue?: string;
    oldValue?: string;
  }>;
}

/**
 * Response from getting changelog
 */
export interface GetChangelogResponse {
  changelog: ChangelogEntry[];
}

/**
 * Request to delete a comment
 */
export interface DeleteCommentRequest {
  comment: string;
}

/**
 * Response from deleting a comment
 */
export interface DeleteCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to edit a comment
 */
export interface EditCommentRequest {
  comment: string;
  text: string;
}

/**
 * Response from editing a comment
 */
export interface EditCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to export vulnerabilities in GitLab SAST format
 */
export interface GitLabSastExportRequest {
  project: string;
  branch?: string;
  pullRequest?: string;
}

/**
 * Response from GitLab SAST export (JSON format)
 */
export interface GitLabSastExportResponse {
  version: string;
  vulnerabilities: Array<{
    id: string;
    category: string;
    name: string;
    message: string;
    description: string;
    cve: string;
    severity: string;
    confidence: string;
    solution?: string;
    scanner: {
      id: string;
      name: string;
    };
    location: {
      file: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      start_line: number;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      end_line: number;
    };
    identifiers: Array<{
      type: string;
      name: string;
      value: string;
      url?: string;
    }>;
  }>;
}

/**
 * Request to reindex issues
 */
export interface ReindexRequest {
  project: string;
}

/**
 * Response from reindex operation
 */
export interface ReindexResponse {
  message: string;
}

/**
 * Request to set severity
 */
export interface SetSeverityRequest {
  issue: string;
  severity: IssueSeverity;
}

/**
 * Response from setting severity
 */
export interface SetSeverityResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to search for tags
 */
export interface SearchTagsRequest {
  q?: string;
  ps?: number;
  organization?: string;
}

/**
 * Response from searching tags
 */
export interface SearchTagsResponse {
  tags: string[];
}
