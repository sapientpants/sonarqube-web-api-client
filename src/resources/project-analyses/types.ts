/**
 * Types for the SonarQube Project Analyses API
 */

/**
 * Event category types for project analyses
 */
export type EventCategory =
  | 'VERSION'
  | 'OTHER'
  | 'QUALITY_PROFILE'
  | 'QUALITY_GATE'
  | 'DEFINITION_CHANGE';

/**
 * Event category types that can be created/updated/deleted
 */
export type MutableEventCategory = 'VERSION' | 'OTHER';

/**
 * Event associated with a project analysis
 */
export interface AnalysisEvent {
  key: string;
  category: EventCategory;
  name: string;
  description?: string;
}

/**
 * Project analysis information
 */
export interface ProjectAnalysis {
  key: string;
  date: string;
  events: AnalysisEvent[];
  projectVersion?: string;
  buildString?: string;
  manualNewCodePeriodBaseline?: boolean;
  revision?: string;
  detectedCI?: string;
}

/**
 * Request parameters for creating an analysis event
 */
export interface CreateEventRequest {
  /** Analysis key */
  analysis: string;
  /** Event category (defaults to OTHER) */
  category?: MutableEventCategory;
  /** Event name (max 400 characters) */
  name: string;
}

/**
 * Response from creating an analysis event
 */
export interface CreateEventResponse {
  event: AnalysisEvent;
}

/**
 * Request parameters for deleting a project analysis
 */
export interface DeleteAnalysisRequest {
  /** Analysis key */
  analysis: string;
}

/**
 * Request parameters for deleting an analysis event
 */
export interface DeleteEventRequest {
  /** Event key */
  event: string;
}

/**
 * Request parameters for searching project analyses
 */
export interface SearchAnalysesRequest {
  /** Key of a long lived branch */
  branch?: string;
  /** Event category filter */
  category?: EventCategory;
  /** Filter analyses created after the given date (inclusive) */
  from?: string;
  /** 1-based page number */
  p?: number;
  /** Project key (required) */
  project: string;
  /** Page size (default 100, max 500) */
  ps?: number;
  /** Filter analyses created before the given date (inclusive) */
  to?: string;
}

/**
 * Response from searching project analyses
 */
export interface SearchAnalysesResponse {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  analyses: ProjectAnalysis[];
}

/**
 * Request parameters for setting analysis baseline
 */
export interface SetBaselineRequest {
  /** Analysis key */
  analysis: string;
  /** Branch key */
  branch?: string;
  /** Project key */
  project: string;
}

/**
 * Request parameters for unsetting analysis baseline
 */
export interface UnsetBaselineRequest {
  /** Branch key */
  branch?: string;
  /** Project key */
  project: string;
}

/**
 * Request parameters for updating an analysis event
 */
export interface UpdateEventRequest {
  /** Event key */
  event: string;
  /** New name (max 400 characters) */
  name: string;
}

/**
 * Response from updating an analysis event
 */
export interface UpdateEventResponse {
  event: AnalysisEvent;
}
