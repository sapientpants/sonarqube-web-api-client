export { IssuesClient } from './IssuesClient';
export { SearchIssuesBuilder } from './builders';
export type {
  // Core types
  Issue,
  IssueComment,
  IssueFlow,
  IssueLocation,
  TextRange,

  // Enums
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueResolution,
  IssueTransition,

  // New Clean Code types
  ImpactSeverity,
  ImpactSoftwareQuality,
  CleanCodeAttributeCategory,
  IssueStatusNew,
  FacetMode,

  // Search types
  SearchIssuesRequest,
  SearchIssuesResponse,

  // Action request/response types
  AddCommentRequest,
  AddCommentResponse,
  AssignIssueRequest,
  AssignIssueResponse,
  DoTransitionRequest,
  DoTransitionResponse,
  SetTagsRequest,
  SetTagsResponse,
} from './types';
