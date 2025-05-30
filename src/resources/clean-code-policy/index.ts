/**
 * Clean Code Policy API v2 module
 *
 * This module provides functionality for creating and managing custom code quality rules
 * in SonarQube using the Clean Code Policy API v2.
 *
 * @since 10.6
 * @module clean-code-policy
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Create a custom rule
 * const rule = await client.cleanCodePolicy
 *   .createRule()
 *   .withKey('no-console-log')
 *   .fromTemplate('javascript:S1234')
 *   .withName('No console.log statements')
 *   .withDescription('Console logging should be removed from production code')
 *   .execute();
 * ```
 */

// Export the client
export { CleanCodePolicyClient } from './CleanCodePolicyClient';

// Export all types
export type {
  // Core types
  RuleSeverity,
  RuleType,
  RuleStatus,
  SoftwareQuality,
  ImpactSeverity,
  CleanCodeAttribute,
  CleanCodeAttributeCategory,
  RuleParameterType,

  // Request/Response types
  CreateCustomRuleV2Request,
  CreateCustomRuleV2Response,

  // Configuration types
  RuleParameter,
  RuleImpact,

  // Validation types
  ValidateCustomRuleOptions,
  RuleValidationResult,

  // Template types
  ListRuleTemplatesOptions,
  RuleTemplate,

  // Error types
  CleanCodePolicyError,
} from './types';

// Export error codes enum
export { CleanCodePolicyErrorCode } from './types';

// Export builders
export { CreateCustomRuleV2Builder, AdvancedCustomRuleBuilder } from './builders';

// Export utilities
export {
  ruleKeyUtils,
  templateUtils,
  parameterUtils,
  patternBuilder,
  messageTemplateUtils,
  ruleMigrationUtils,
  cleanCodeAttributeUtils,
} from './utils';
