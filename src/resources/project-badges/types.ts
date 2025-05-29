/**
 * Valid metric keys for project badges
 */
export type BadgeMetric =
  | 'coverage'
  | 'ncloc'
  | 'code_smells'
  | 'sqale_rating'
  | 'security_rating'
  | 'bugs'
  | 'vulnerabilities'
  | 'duplicated_lines_density'
  | 'reliability_rating'
  | 'alert_status'
  | 'sqale_index';

/**
 * Base parameters shared by all badge endpoints
 */
export interface BaseBadgeParams {
  /**
   * Project or application key
   */
  project: string;

  /**
   * Security token for private projects
   */
  token?: string;
}

/**
 * Parameters for AI code assurance badge
 */
export type AiCodeAssuranceBadgeParams = BaseBadgeParams;

/**
 * Parameters for measure badge
 */
export interface MeasureBadgeParams extends BaseBadgeParams {
  /**
   * Metric key
   */
  metric: BadgeMetric;

  /**
   * Long-lived branch key
   */
  branch?: string;
}

/**
 * Parameters for quality gate badge
 */
export interface QualityGateBadgeParams extends BaseBadgeParams {
  /**
   * Long-lived branch key
   */
  branch?: string;
}
