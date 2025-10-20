import type { PaginatedRequest, PaginatedResponse } from '../../core/builders/index.js';

/**
 * Task status in Compute Engine
 */
export enum TaskStatus {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
}

/**
 * Task type
 */
export enum TaskType {
  REPORT = 'REPORT',
}

/**
 * Branch type for CE tasks
 */
export enum BranchType {
  Branch = 'BRANCH',
  PullRequest = 'PULL_REQUEST',
}

/**
 * Common task fields
 */
export interface Task {
  id: string;
  type: TaskType;
  componentId?: string;
  componentKey?: string;
  componentName?: string;
  componentQualifier?: string;
  analysisId?: string;
  status: TaskStatus;
  submittedAt: string;
  submitterLogin?: string;
  startedAt?: string;
  executedAt?: string;
  executionTimeMs?: number;
  logs?: boolean;
  hasScannerContext?: boolean;
  scannerContext?: string;
  warnings?: string[];
  warningCount?: number;
  errorMessage?: string;
  errorStacktrace?: string;
  errorType?: string;
  hasSomeCodeChanged?: boolean;
  branch?: string;
  branchType?: BranchType;
  pullRequest?: string;
  infoMessages?: string[];
}

/**
 * Activity task (includes organization info)
 */
export interface ActivityTask extends Task {
  organization?: string;
  organizationKey?: string;
}

/**
 * Activity search request parameters
 */
export interface ActivityRequest extends PaginatedRequest {
  component?: string;
  componentId?: string;
  maxExecutedAt?: string;
  minSubmittedAt?: string;
  onlyCurrents?: boolean;
  q?: string;
  status?: TaskStatus[];
  type?: TaskType;
}

/**
 * Activity search response
 */
export interface ActivityResponse extends PaginatedResponse {
  tasks: ActivityTask[];
}

/**
 * Activity status request parameters
 */
export interface ActivityStatusRequest {
  componentId?: string;
  componentKey?: string;
}

/**
 * Activity status response
 */
export interface ActivityStatusResponse {
  pending: number;
  inProgress: number;
  failing: number;
  pendingTime?: number;
}

/**
 * Component tasks request parameters
 */
export interface ComponentTasksRequest {
  component?: string;
  componentId?: string;
}

/**
 * Component tasks response
 */
export interface ComponentTasksResponse {
  queue: Task[];
  current?: Task;
  lastExecutedTask?: Task;
}

/**
 * Task details request parameters
 */
export interface TaskRequest {
  id: string;
  additionalFields?: Array<'scannerContext' | 'warnings'>;
}

/**
 * Task details response
 */
export interface TaskResponse {
  task: Task;
}
