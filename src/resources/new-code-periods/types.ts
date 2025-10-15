/**
 * Types for New Code Periods API
 *
 * @since SonarQube 8.0
 */

/**
 * Available new code period types
 */
export enum NewCodePeriodType {
  PREVIOUS_VERSION = 'PREVIOUS_VERSION',

  NUMBER_OF_DAYS = 'NUMBER_OF_DAYS',

  SPECIFIC_ANALYSIS = 'SPECIFIC_ANALYSIS',

  REFERENCE_BRANCH = 'REFERENCE_BRANCH',
}

/**
 * New code period definition
 */
export interface NewCodePeriod {
  /** Type of new code period */
  type: NewCodePeriodType;
  /** Value associated with the type (days, analysis ID, branch name) */
  value?: string;
  /** Whether this is the default setting */
  inherited?: boolean;
}

/**
 * Project branch new code period information
 */
export interface BranchNewCodePeriod {
  /** Project key */
  projectKey: string;
  /** Branch name */
  branchKey: string;
  /** New code period definition */
  newCodePeriod: NewCodePeriod;
}

/**
 * Request parameters for listing new code periods
 */
export interface ListNewCodePeriodsRequest {
  /** Project key */
  project: string;
  /** Branch name (optional) */
  branch?: string;
}

/**
 * Response for listing new code periods
 */
export interface ListNewCodePeriodsResponse {
  /** List of new code periods for branches */
  newCodePeriods: BranchNewCodePeriod[];
}

/**
 * Request parameters for setting new code period
 */
export interface SetNewCodePeriodRequest {
  /** Project key (optional - if not provided, sets global default) */
  project?: string;
  /** Branch name (optional - if not provided with project, sets project default) */
  branch?: string;
  /** Type of new code period */
  type: NewCodePeriodType;
  /** Value for the new code period type */
  value?: string;
}

/**
 * Response for setting new code period
 */
export interface SetNewCodePeriodResponse {
  /** Updated new code period */
  newCodePeriod: NewCodePeriod;
}

/**
 * Request parameters for unsetting new code period
 */
export interface UnsetNewCodePeriodRequest {
  /** Project key */
  project: string;
  /** Branch name (optional) */
  branch?: string;
}

/**
 * Request parameters for showing new code period
 */
export interface ShowNewCodePeriodRequest {
  /** Project key (optional - if not provided, shows global default) */
  project?: string;
  /** Branch name (optional - if not provided with project, shows project default) */
  branch?: string;
}

/**
 * Response for showing new code period
 */
export interface ShowNewCodePeriodResponse {
  /** Project key */
  projectKey?: string;
  /** Branch key */
  branchKey?: string;
  /** New code period definition */
  type: NewCodePeriodType;
  /** Value associated with the type */
  value?: string;
  /** Whether this is the default setting */
  inherited?: boolean;
}
