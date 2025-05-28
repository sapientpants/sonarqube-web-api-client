/**
 * Represents a branch in a SonarQube project.
 */
export interface Branch {
  /**
   * The branch name.
   */
  name: string;

  /**
   * The branch type (BRANCH or PULL_REQUEST).
   */
  type: ProjectBranchType;

  /**
   * Whether this is the main branch.
   */
  isMain: boolean;

  /**
   * The branch ID.
   */
  branchId?: string;

  /**
   * The branch UUID V1.
   */
  branchUuidV1?: string;

  /**
   * Status of the branch.
   */
  status?: BranchStatusValue;

  /**
   * Date when the branch was last analyzed.
   */
  analysisDate?: string;

  /**
   * Whether the branch is excluded from automatic purge operations.
   */
  excludedFromPurge?: boolean;

  /**
   * Issue counts on the branch.
   */
  issueCount?: number;

  /**
   * Bug count on the branch.
   */
  bugCount?: number;

  /**
   * Vulnerability count on the branch.
   */
  vulnerabilityCount?: number;

  /**
   * Code smell count on the branch.
   */
  codeSmellCount?: number;

  /**
   * Security hotspot count on the branch.
   */
  securityHotspotCount?: number;

  /**
   * Quality gate status of the branch.
   */
  qualityGateStatus?: QualityGateStatus;
}

/**
 * Branch type enumeration.
 */
export enum ProjectBranchType {
  Branch = 'BRANCH',
  PullRequest = 'PULL_REQUEST',
}

/**
 * Branch status value.
 */
export type BranchStatusValue = 'OK' | 'ERROR' | 'NONE';

/**
 * Quality gate status enumeration.
 */
export enum QualityGateStatus {
  OK = 'OK',
  WARN = 'WARN',
  ERROR = 'ERROR',
  NONE = 'NONE',
}

/**
 * Parameters for listing branches.
 */
export interface ListBranchesParams {
  /**
   * Project key - required unless branchIds is provided.
   */
  project?: string;

  /**
   * List of up to 50 branch IDs - required unless project key is provided.
   */
  branchIds?: string[];
}

/**
 * Response from listing branches.
 */
export interface ListBranchesResponse {
  /**
   * List of branches.
   */
  branches: Branch[];
}

/**
 * Parameters for deleting a branch.
 */
export interface DeleteBranchParams {
  /**
   * Project key.
   */
  project: string;

  /**
   * Name of the branch.
   */
  branch: string;
}

/**
 * Parameters for renaming the main branch.
 */
export interface RenameMainBranchParams {
  /**
   * Project key.
   */
  project: string;

  /**
   * New name of the main branch.
   */
  name: string;
}
