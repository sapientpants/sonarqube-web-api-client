/**
 * Types for the SonarQube Clean Code Policy API v2
 * @since 10.6
 * @see {@link https://next.sonarqube.com/sonarqube/web_api_v2#clean-code-policy}
 */

/**
 * Severity levels for custom rules
 */
export type RuleSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';

/**
 * Types of issues that rules can detect
 */
export type RuleType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Status of a custom rule
 */
export type RuleStatus = 'BETA' | 'DEPRECATED' | 'READY' | 'REMOVED';

/**
 * Software quality impacts
 */
export type SoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';

/**
 * Impact severity levels
 */
export type ImpactSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Clean code attributes
 */
export type CleanCodeAttribute =
  | 'CONVENTIONAL'
  | 'FORMATTED'
  | 'IDENTIFIABLE'
  | 'CLEAR'
  | 'COMPLETE'
  | 'EFFICIENT'
  | 'LOGICAL'
  | 'DISTINCT'
  | 'FOCUSED'
  | 'MODULAR'
  | 'TESTED'
  | 'LAWFUL'
  | 'RESPECTFUL'
  | 'TRUSTWORTHY';

/**
 * Clean code attribute categories
 */
export type CleanCodeAttributeCategory = 'CONSISTENT' | 'INTENTIONAL' | 'ADAPTABLE' | 'RESPONSIBLE';

/**
 * Parameter types for rule configuration
 */
export type RuleParameterType = 'STRING' | 'INTEGER' | 'BOOLEAN' | 'FLOAT' | 'TEXT';

/**
 * Rule parameter definition
 */
export interface RuleParameter {
  /**
   * Unique key for the parameter
   */
  key: string;

  /**
   * Display name for the parameter
   */
  name?: string;

  /**
   * HTML description of the parameter
   */
  htmlDescription?: string;

  /**
   * Default value for the parameter
   */
  defaultValue?: string;

  /**
   * Type of the parameter
   */
  type?: RuleParameterType;

  /**
   * Possible values for the parameter (for select lists)
   */
  values?: string[];
}

/**
 * Impact of a rule on software quality
 */
export interface RuleImpact {
  /**
   * Software quality affected by the rule
   */
  softwareQuality: SoftwareQuality;

  /**
   * Severity of the impact
   */
  severity: ImpactSeverity;
}

/**
 * Request to create a custom rule
 * @since 10.6
 */
export interface CreateCustomRuleV2Request {
  /**
   * Unique key for the custom rule
   * Must be unique within the repository
   */
  key: string;

  /**
   * Template rule key to base this custom rule on
   * Required when creating rules from templates
   */
  templateKey: string;

  /**
   * Display name for the rule
   */
  name: string;

  /**
   * Markdown description of what the rule detects and why
   */
  markdownDescription: string;

  /**
   * Current status of the rule
   * @default 'READY'
   */
  status?: RuleStatus;

  /**
   * Parameters for rule configuration
   * Must match the template's parameter definitions
   */
  parameters?: Array<{
    /**
     * Parameter key (must match template parameter key)
     */
    key: string;

    /**
     * Parameter value
     */
    value: string;
  }>;
}

/**
 * Response from creating a custom rule
 * @since 10.6
 */
export interface CreateCustomRuleV2Response {
  /**
   * Unique identifier for the created rule
   */
  id: string;

  /**
   * Repository key where the rule belongs
   */
  repositoryKey: string;

  /**
   * Rule key within the repository
   */
  key: string;

  /**
   * Full rule key (repositoryKey:key)
   */
  ruleKey?: string;

  /**
   * Display name of the rule
   */
  name: string;

  /**
   * HTML description of the rule
   */
  htmlDescription?: string;

  /**
   * Markdown description of the rule
   */
  markdownDescription?: string;

  /**
   * Legacy severity level (deprecated in favor of impacts)
   * @deprecated Use impacts instead
   */
  severity?: RuleSeverity;

  /**
   * Type of issue the rule detects (deprecated in favor of impacts)
   * @deprecated Use impacts instead
   */
  type?: RuleType;

  /**
   * Current status of the rule
   */
  status: RuleStatus;

  /**
   * Rule impacts on software qualities
   */
  impacts: RuleImpact[];

  /**
   * Primary software quality impacted
   */
  softwareQuality?: SoftwareQuality;

  /**
   * Clean code attribute for the rule
   */
  cleanCodeAttribute?: CleanCodeAttribute;

  /**
   * Clean code attribute category
   */
  cleanCodeAttributeCategory?: CleanCodeAttributeCategory;

  /**
   * Tags associated with the rule
   */
  tags?: string[];

  /**
   * System tags (non-editable)
   */
  systemTags?: string[];

  /**
   * Language the rule applies to
   */
  language?: string;

  /**
   * Language name for display
   */
  languageName?: string;

  /**
   * Whether this is a template rule
   */
  isTemplate?: boolean;

  /**
   * Template key if this rule is based on a template
   */
  templateKey?: string;

  /**
   * Parameters configured for the rule
   */
  parameters?: RuleParameter[];

  /**
   * When the rule was created
   */
  createdAt?: string;

  /**
   * When the rule was last updated
   */
  updatedAt?: string;

  /**
   * Remediation function type
   */
  remediationFunction?: 'LINEAR' | 'LINEAR_OFFSET' | 'CONSTANT';

  /**
   * Remediation base effort
   */
  remediationBaseEffort?: string;

  /**
   * Remediation gap multiplier
   */
  remediationGapMultiplier?: string;

  /**
   * Gap description for remediation
   */
  gapDescription?: string;

  /**
   * Whether this rule is external
   */
  isExternal?: boolean;

  /**
   * Deprecation date if status is DEPRECATED
   */
  deprecatedKeys?: string[];

  /**
   * Educational principle keys
   */
  educationPrinciples?: string[];

  /**
   * Scope of the rule (MAIN or TEST code)
   */
  scope?: 'MAIN' | 'TEST' | 'ALL';
}

/**
 * Options for validating custom rules
 */
export interface ValidateCustomRuleOptions {
  /**
   * Whether to perform strict validation
   * @default true
   */
  strict?: boolean;

  /**
   * Whether to validate parameter values against template
   * @default true
   */
  validateParameters?: boolean;

  /**
   * Whether to check for rule key uniqueness
   * @default true
   */
  checkUniqueness?: boolean;
}

/**
 * Result of rule validation
 */
export interface RuleValidationResult {
  /**
   * Whether the rule is valid
   */
  valid: boolean;

  /**
   * Validation errors (if any)
   */
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;

  /**
   * Validation warnings (non-blocking issues)
   */
  warnings?: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Options for listing rule templates
 */
export interface ListRuleTemplatesOptions {
  /**
   * Filter by language
   */
  language?: string;

  /**
   * Filter by repository
   */
  repository?: string;

  /**
   * Include only templates that can create custom rules
   */
  customizable?: boolean;

  /**
   * Search query
   */
  query?: string;
}

/**
 * Rule template information
 */
export interface RuleTemplate {
  /**
   * Template key
   */
  key: string;

  /**
   * Repository key
   */
  repositoryKey: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Template description
   */
  description: string;

  /**
   * Language the template applies to
   */
  language: string;

  /**
   * Parameters that can be configured
   */
  parameters: RuleParameter[];

  /**
   * Default severity
   */
  defaultSeverity?: RuleSeverity;

  /**
   * Default impacts
   */
  defaultImpacts?: RuleImpact[];

  /**
   * Tags associated with the template
   */
  tags?: string[];
}

/**
 * Error codes specific to Clean Code Policy API
 */
export enum CleanCodePolicyErrorCode {
  /**
   * Rule key already exists
   */
  RuleKeyExists = 'RULE_KEY_EXISTS',

  /**
   * Template not found
   */
  TemplateNotFound = 'TEMPLATE_NOT_FOUND',

  /**
   * Invalid parameter value
   */
  InvalidParameter = 'INVALID_PARAMETER',

  /**
   * Missing required parameter
   */
  MissingParameter = 'MISSING_PARAMETER',

  /**
   * Insufficient permissions
   */
  InsufficientPermissions = 'INSUFFICIENT_PERMISSIONS',

  /**
   * Invalid rule configuration
   */
  InvalidRuleConfig = 'INVALID_RULE_CONFIG',
}

/**
 * Clean Code Policy API error details
 */
export interface CleanCodePolicyError {
  /**
   * Error code
   */
  code: CleanCodePolicyErrorCode;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}
