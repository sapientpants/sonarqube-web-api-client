/**
 * Quality gate metric operator types
 */
export type QualityGateOperator = 'LT' | 'GT' | 'EQ' | 'NE';

/**
 * Quality gate condition
 */
export interface QualityGateCondition {
  id: string;
  metric: string;
  operator: QualityGateOperator;
  threshold: string;
  error?: string;
  warning?: string;
}

/**
 * Quality gate entity
 */
export interface QualityGate {
  id: string;
  name: string;
  isDefault: boolean;
  isBuiltIn: boolean;
  conditions?: QualityGateCondition[];
}

/**
 * Request parameters for creating a quality gate
 */
export interface CreateQualityGateRequest {
  name: string;
}

/**
 * Request parameters for updating a quality gate
 */
export interface UpdateQualityGateRequest {
  id: string;
  name?: string;
}

/**
 * Request parameters for deleting a quality gate
 */
export interface DeleteQualityGateRequest {
  id: string;
}

/**
 * Request parameters for setting a quality gate as default
 */
export interface SetAsDefaultRequest {
  id: string;
}

/**
 * Request parameters for copying a quality gate
 */
export interface CopyQualityGateRequest {
  id: string;
  name: string;
}

/**
 * Request parameters for renaming a quality gate
 */
export interface RenameQualityGateRequest {
  id: string;
  name: string;
}

/**
 * Request parameters for getting a single quality gate
 */
export interface GetQualityGateRequest {
  id: string;
}

/**
 * Response for listing quality gates
 */
export interface ListQualityGatesResponse {
  qualitygates: QualityGate[];
  default?: string;
}

/**
 * Request parameters for setting a condition on a quality gate
 */
export interface SetConditionRequest {
  gateId: string;
  metric: string;
  operator: QualityGateOperator;
  error?: string;
  warning?: string;
}

/**
 * Request parameters for updating a condition
 */
export interface UpdateConditionRequest {
  id: string;
  metric?: string;
  operator?: QualityGateOperator;
  error?: string;
  warning?: string;
}

/**
 * Request parameters for deleting a condition
 */
export interface DeleteConditionRequest {
  id: string;
}

/**
 * Project associated with a quality gate
 */
export interface QualityGateProject {
  key: string;
  name: string;
  selected?: boolean;
}

/**
 * Request parameters for getting projects using a quality gate
 */
export interface GetProjectsRequest {
  gateId: string;
  p?: number; // page number
  ps?: number; // page size
  query?: string;
  selected?: 'all' | 'selected' | 'deselected';
}

/**
 * Response for getting projects using a quality gate
 */
export interface GetProjectsResponse {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  results: QualityGateProject[];
}

/**
 * Request parameters for associating projects with a quality gate
 */
export interface AssociateProjectsRequest {
  gateId: string;
  projectKeys: string[];
}

/**
 * Request parameters for dissociating projects from a quality gate
 */
export interface DissociateProjectsRequest {
  gateId: string;
  projectKeys: string[];
}

/**
 * Quality gate status for a project
 */
export interface ProjectQualityGateStatus {
  projectKey: string;
  projectName: string;
  projectStatus: 'OK' | 'WARN' | 'ERROR' | 'NONE';
  conditions?: QualityGateConditionStatus[];
  ignoredConditions?: boolean;
  period?: {
    index: number;
    mode: string;
    date?: string;
    parameter?: string;
  };
  caycStatus?: 'compliant' | 'non-compliant';
}

/**
 * Quality gate condition status
 */
export interface QualityGateConditionStatus {
  status: 'OK' | 'WARN' | 'ERROR' | 'NO_VALUE';
  metricKey: string;
  comparator: QualityGateOperator;
  periodIndex?: number;
  errorThreshold?: string;
  warningThreshold?: string;
  actualValue?: string;
}

/**
 * Request parameters for getting project quality gate status
 */
export interface GetProjectStatusRequest {
  projectKey?: string;
  projectId?: string;
  analysisId?: string;
  branch?: string;
  pullRequest?: string;
}
