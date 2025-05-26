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
export type IssueStatus =
  | 'OPEN'
  | 'CONFIRMED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'TO_REVIEW'
  | 'IN_REVIEW'
  | 'REVIEWED';

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
  cleanCodeAttributeCategories?: CleanCodeAttributeCategory[];
  componentKeys?: string[];
  components?: string[];
  createdAfter?: string;
  createdAt?: string;
  createdBefore?: string;
  createdInLast?: string;
  cwe?: string[];
  facetMode?: FacetMode;
  facets?: string[];
  impactSeverities?: ImpactSeverity[];
  impactSoftwareQualities?: ImpactSoftwareQuality[];
  inNewCodePeriod?: boolean;
  issueStatuses?: IssueStatusNew[];
  issues?: string[];
  languages?: string[];
  onComponentOnly?: boolean;
  organization?: string;
  owaspTop10?: string[];
  owaspTop10v2021?: string[]; // Maps to 'owaspTop10-2021' in API
  projects?: string[];
  pullRequest?: string;
  resolutions?: IssueResolution[]; // deprecated
  resolved?: boolean;
  rules?: string[];
  s?: string; // sort field
  sansTop25?: string[];
  severities?: IssueSeverity[]; // deprecated
  sinceLeakPeriod?: boolean;
  sonarsourceSecurity?: string[];
  sonarsourceSecurityCategory?: string[];
  statuses?: IssueStatus[]; // deprecated
  tags?: string[];
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
