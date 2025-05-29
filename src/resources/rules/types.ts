/**
 * Types for SonarQube Rules API
 */

/**
 * Rule severity levels
 */
export type RuleSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';

/**
 * Rule status
 */
export type RuleStatus = 'BETA' | 'DEPRECATED' | 'READY' | 'REMOVED';

/**
 * Rule type
 */
export type RuleType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Clean Code attribute category
 */
export type CleanCodeAttributeCategory = 'ADAPTABLE' | 'CONSISTENT' | 'INTENTIONAL' | 'RESPONSIBLE';

/**
 * Software quality
 */
export type SoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';

/**
 * Impact severity
 */
export type ImpactSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';

/**
 * Inheritance type for rule activation
 */
export type RuleInheritance = 'NONE' | 'INHERITED' | 'OVERRIDES';

/**
 * Remediation function type
 */
export type RemediationFunctionType = 'LINEAR' | 'LINEAR_OFFSET' | 'CONSTANT_ISSUE';

/**
 * Facet mode
 */
export type FacetMode = 'COUNT' | 'EFFORT' | 'DEBT';

/**
 * Rule repository
 */
export interface RuleRepository {
  key: string;
  name: string;
  language: string;
}

/**
 * Request parameters for listing rule repositories
 */
export interface ListRepositoriesRequest {
  /**
   * A language key; if provided, only repositories for the given language will be returned
   */
  language?: string;
  /**
   * A pattern to match repository keys/names against
   */
  q?: string;
}

/**
 * Response for listing rule repositories
 */
export interface ListRepositoriesResponse {
  repositories: RuleRepository[];
}

/**
 * Rule parameter definition
 */
export interface RuleParameter {
  key: string;
  htmlDesc?: string;
  defaultValue?: string;
  type?: string;
}

/**
 * Rule description section
 */
export interface RuleDescriptionSection {
  key: string;
  content: string;
  context?: {
    displayName?: string;
    key?: string;
  };
}

/**
 * Rule impact
 */
export interface RuleImpact {
  softwareQuality: SoftwareQuality;
  severity: ImpactSeverity;
}

/**
 * Rule activation details
 */
export interface RuleActivation {
  qProfile: string;
  inherit: RuleInheritance;
  severity: RuleSeverity;
  params?: Array<{
    key: string;
    value: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Rule details
 */
export interface Rule {
  key: string;
  repo: string;
  name: string;
  htmlDesc?: string; // Deprecated, use descriptionSections
  mdDesc?: string;
  descriptionSections?: RuleDescriptionSection[];
  severity: RuleSeverity;
  status: RuleStatus;
  type: RuleType;
  internalKey?: string;
  isTemplate?: boolean;
  isExternal?: boolean;
  templateKey?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  sysTags?: string[];
  lang?: string;
  langName?: string;
  params?: RuleParameter[];
  remFn?: RemediationFunctionType;
  remFnBaseEffort?: string;
  remFnGapMultiplier?: string;
  remFnOverloaded?: boolean;
  defaultRemFn?: RemediationFunctionType;
  defaultRemFnBaseEffort?: string;
  defaultRemFnGapMultiplier?: string;
  gapDescription?: string;
  scope?: string;
  securityStandards?: string[];
  deprecatedKeys?: string[];
  educationPrinciples?: string[];
  noteLogin?: string;
  htmlNote?: string;
  mdNote?: string;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: CleanCodeAttributeCategory;
  impacts?: RuleImpact[];
  actives?: RuleActivation[];
}

/**
 * Request parameters for searching rules
 */
/* eslint-disable @typescript-eslint/naming-convention */
export interface SearchRulesRequest {
  /**
   * Filter rules that are activated or deactivated on the selected Quality profile
   */
  activation?: boolean;
  /**
   * Comma-separated list of activation severities
   */
  active_severities?: RuleSeverity[];
  /**
   * Ascending sort
   */
  asc?: boolean;
  /**
   * Filters rules added since date. Format is yyyy-MM-dd
   */
  available_since?: string;
  /**
   * Comma-separated list of Clean Code Attribute Categories
   */
  cleanCodeAttributeCategories?: CleanCodeAttributeCategory[];
  /**
   * Comma-separated list of CWE identifiers
   */
  cwe?: string[];
  /**
   * Comma-separated list of the fields to be returned in response
   */
  f?: string[];
  /**
   * Comma-separated list of the facets to be computed
   */
  facets?: string[];
  /**
   * Comma-separated list of Software Quality Severities
   */
  impactSeverities?: ImpactSeverity[];
  /**
   * Comma-separated list of Software Qualities
   */
  impactSoftwareQualities?: SoftwareQuality[];
  /**
   * Include external engine rules in the results
   */
  include_external?: boolean;
  /**
   * Comma-separated list of values of inheritance for a rule within a quality profile
   */
  inheritance?: RuleInheritance[];
  /**
   * Filter template rules
   */
  is_template?: boolean;
  /**
   * Comma-separated list of languages
   */
  languages?: string[];
  /**
   * Organization key
   */
  organization?: string;
  /**
   * Comma-separated list of OWASP Top 10 lowercase categories
   */
  owaspTop10?: string[];
  /**
   * Comma-separated list of OWASP Top 10 (2021) lowercase categories
   */
  'owaspTop10-2021'?: string[];
  /**
   * 1-based page number
   */
  p?: number;
  /**
   * Page size. Must be greater than 0 and less or equal than 500
   */
  ps?: number;
  /**
   * UTF-8 search query
   */
  q?: string;
  /**
   * Quality profile key to filter on
   */
  qprofile?: string;
  /**
   * Comma-separated list of repositories
   */
  repositories?: string[];
  /**
   * Key of rule to search for
   */
  rule_key?: string;
  /**
   * Comma-separated list of rule keys
   */
  rule_keys?: string[];
  /**
   * Sort field
   */
  s?: 'name' | 'updatedAt' | 'createdAt' | 'key';
  /**
   * Comma-separated list of default severities
   */
  severities?: RuleSeverity[];
  /**
   * Comma-separated list of SonarSource security categories
   */
  sonarsourceSecurity?: string[];
  /**
   * Comma-separated list of status codes
   */
  statuses?: RuleStatus[];
  /**
   * Comma-separated list of tags
   */
  tags?: string[];
  /**
   * Key of the template rule to filter on
   */
  template_key?: string;
  /**
   * Comma-separated list of types
   */
  types?: RuleType[];
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Response for searching rules
 */
export interface SearchRulesResponse {
  total: number;
  p: number;
  ps: number;
  rules: Rule[];
  facets?: Array<{
    property: string;
    values: Array<{
      val: string;
      count: number;
    }>;
  }>;
  paging?: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Request parameters for showing rule details
 */
export interface ShowRuleRequest {
  /**
   * Rule key
   */
  key: string;
  /**
   * Organization key
   */
  organization: string;
  /**
   * Show rule's activations for all profiles
   */
  actives?: boolean;
}

/**
 * Response for showing rule details
 */
export interface ShowRuleResponse {
  rule: Rule;
  actives?: RuleActivation[];
}

/**
 * Request parameters for listing rule tags
 */
export interface ListTagsRequest {
  /**
   * Organization key
   */
  organization: string;
  /**
   * Page size. Must be greater than 0 and less or equal than 100
   */
  ps?: number;
  /**
   * Limit search to tags that contain the supplied string
   */
  q?: string;
}

/**
 * Response for listing rule tags
 */
export interface ListTagsResponse {
  tags: string[];
}

/**
 * Request parameters for updating a rule
 */
/* eslint-disable @typescript-eslint/naming-convention */
export interface UpdateRuleRequest {
  /**
   * Key of the rule to update
   */
  key: string;
  /**
   * Organization key
   */
  organization: string;
  /**
   * Rule description (mandatory for custom rule and manual rule)
   */
  markdown_description?: string;
  /**
   * Optional note in markdown format
   */
  markdown_note?: string;
  /**
   * Rule name (mandatory for custom rule)
   */
  name?: string;
  /**
   * Parameters as semi-colon list of <key>=<value>
   */
  params?: string;
  /**
   * Base effort of the remediation function of the rule
   */
  remediation_fn_base_effort?: string;
  /**
   * Type of the remediation function of the rule
   */
  remediation_fn_type?: RemediationFunctionType;
  /**
   * Gap multiplier of the remediation function of the rule
   */
  remediation_fy_gap_multiplier?: string;
  /**
   * Rule severity (Only when updating a custom rule)
   */
  severity?: RuleSeverity;
  /**
   * Rule status (Only when updating a custom rule)
   */
  status?: RuleStatus;
  /**
   * Optional comma-separated list of tags to set
   */
  tags?: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Response for updating a rule
 */
export interface UpdateRuleResponse {
  rule: Rule;
}
