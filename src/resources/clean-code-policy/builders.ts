import { BaseBuilder } from '../../core/builders/index.js';
import type {
  CreateCustomRuleV2Request,
  CreateCustomRuleV2Response,
  RuleStatus,
  ValidateCustomRuleOptions,
  RuleValidationResult,
  ImpactSeverity,
} from './types.js';

/**
 * Builder for creating custom rules with fluent API
 * @since 10.6
 */
export class CreateCustomRuleV2Builder extends BaseBuilder<
  CreateCustomRuleV2Request,
  CreateCustomRuleV2Response
> {
  constructor(
    executor: (request: CreateCustomRuleV2Request) => Promise<CreateCustomRuleV2Response>,
  ) {
    super(executor);
    // Initialize with empty request
    this.params = {} as CreateCustomRuleV2Request;
  }

  /**
   * Set the unique key for the custom rule
   * @param key - Unique rule key within the repository
   * @returns Builder instance for chaining
   */
  withKey(key: string): this {
    return this.setParam('key', key);
  }

  /**
   * Set the template key to base this rule on
   * @param templateKey - Key of the template rule
   * @returns Builder instance for chaining
   */
  fromTemplate(templateKey: string): this {
    return this.setParam('templateKey', templateKey);
  }

  /**
   * Set the display name for the rule
   * @param name - Human-readable rule name
   * @returns Builder instance for chaining
   */
  withName(name: string): this {
    return this.setParam('name', name);
  }

  /**
   * Set the markdown description explaining what the rule detects
   * @param description - Detailed markdown description
   * @returns Builder instance for chaining
   */
  withDescription(description: string): this {
    return this.setParam('markdownDescription', description);
  }

  /**
   * Set the markdown description (alias for withDescription)
   * @param markdownDescription - Detailed markdown description
   * @returns Builder instance for chaining
   */
  withMarkdownDescription(markdownDescription: string): this {
    return this.setParam('markdownDescription', markdownDescription);
  }

  /**
   * Set the rule status
   * @param status - Rule status (BETA, READY, DEPRECATED, REMOVED)
   * @returns Builder instance for chaining
   */
  withStatus(status: RuleStatus): this {
    return this.setParam('status', status);
  }

  /**
   * Add a parameter configuration
   * @param key - Parameter key (must match template parameter)
   * @param value - Parameter value
   * @returns Builder instance for chaining
   */
  withParameter(key: string, value: string): this {
    const currentParams = this.params.parameters ?? [];
    return this.setParam('parameters', [...currentParams, { key, value }]);
  }

  /**
   * Set multiple parameters at once
   * @param parameters - Array of parameter configurations
   * @returns Builder instance for chaining
   */
  withParameters(parameters: Array<{ key: string; value: string }>): this {
    return this.setParam('parameters', parameters);
  }

  /**
   * Add parameters as a key-value object
   * @param parameters - Object with parameter keys and values
   * @returns Builder instance for chaining
   */
  withParameterMap(parameters: Record<string, string>): this {
    const paramArray = Object.entries(parameters).map(([key, value]) => ({ key, value }));
    return this.setParam('parameters', paramArray);
  }

  /**
   * Clear all parameters
   * @returns Builder instance for chaining
   */
  clearParameters(): this {
    return this.setParam('parameters', []);
  }

  /**
   * Validate the rule configuration before execution
   * @param options - Validation options
   * @returns Validation result
   */
  async validate(options?: ValidateCustomRuleOptions): Promise<RuleValidationResult> {
    const errors: Array<{ field: string; message: string; code?: string }> = [];
    const warnings: Array<{ field: string; message: string; suggestion?: string }> = [];

    this.validateKey(errors);
    this.validateTemplateKey(errors);
    this.validateName(errors);
    this.validateDescription(errors, warnings);

    if (options?.validateParameters !== false) {
      this.validateParameters(errors, warnings);
    }

    return await Promise.resolve(this.buildValidationResult(errors, warnings));
  }

  /**
   * Build the request object
   * @returns The complete request object
   */
  build(): CreateCustomRuleV2Request {
    // Return the params ensuring all required fields are present
    // TypeScript will enforce that key, templateKey, name, and markdownDescription are set
    return {
      key: this.params.key ?? '',
      templateKey: this.params.templateKey ?? '',
      name: this.params.name ?? '',
      markdownDescription: this.params.markdownDescription ?? '',
      status: this.params.status ?? 'READY',
      ...(this.params.parameters && { parameters: this.params.parameters }),
    };
  }

  /**
   * Execute the rule creation
   * @returns Promise resolving to the created rule
   */
  async execute(): Promise<CreateCustomRuleV2Response> {
    // Validate before execution
    const validation = await this.validate({ strict: true });
    if (!validation.valid && validation.errors) {
      throw new Error(
        `Invalid rule configuration: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    return this.executor(this.build());
  }

  private validateKey(errors: Array<{ field: string; message: string; code?: string }>): void {
    if (this.params.key === undefined || this.params.key === '') {
      errors.push({
        field: 'key',
        message: 'Rule key is required',
        code: 'MISSING_KEY',
      });
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(this.params.key)) {
      errors.push({
        field: 'key',
        message:
          'Rule key must start with a letter and contain only letters, numbers, underscores, and hyphens',
        code: 'INVALID_KEY_FORMAT',
      });
    }
  }

  private validateTemplateKey(
    errors: Array<{ field: string; message: string; code?: string }>,
  ): void {
    if (this.params.templateKey === undefined || this.params.templateKey === '') {
      errors.push({
        field: 'templateKey',
        message: 'Template key is required',
        code: 'MISSING_TEMPLATE',
      });
    }
  }

  private validateName(errors: Array<{ field: string; message: string; code?: string }>): void {
    if (this.params.name === undefined || this.params.name === '') {
      errors.push({
        field: 'name',
        message: 'Rule name is required',
        code: 'MISSING_NAME',
      });
      return;
    }

    if (this.params.name.length > 200) {
      errors.push({
        field: 'name',
        message: 'Rule name must not exceed 200 characters',
        code: 'NAME_TOO_LONG',
      });
    }
  }

  private validateDescription(
    errors: Array<{ field: string; message: string; code?: string }>,
    warnings: Array<{ field: string; message: string; suggestion?: string }>,
  ): void {
    if (this.params.markdownDescription === undefined || this.params.markdownDescription === '') {
      errors.push({
        field: 'markdownDescription',
        message: 'Rule description is required',
        code: 'MISSING_DESCRIPTION',
      });
      return;
    }

    if (this.params.markdownDescription.length < 10) {
      warnings.push({
        field: 'markdownDescription',
        message: 'Rule description is very short',
        suggestion:
          'Consider providing a more detailed description to help users understand the rule',
      });
    }
  }

  private validateParameters(
    errors: Array<{ field: string; message: string; code?: string }>,
    warnings: Array<{ field: string; message: string; suggestion?: string }>,
  ): void {
    if (!this.params.parameters) {
      return;
    }

    for (const param of this.params.parameters) {
      this.validateSingleParameter(param, errors, warnings);
    }
  }

  private validateSingleParameter(
    param: { key: string; value: string },
    errors: Array<{ field: string; message: string; code?: string }>,
    warnings: Array<{ field: string; message: string; suggestion?: string }>,
  ): void {
    if (param.key === '') {
      errors.push({
        field: 'parameters',
        message: 'Parameter key is required',
        code: 'MISSING_PARAMETER_KEY',
      });
    }

    if (param.value === '') {
      warnings.push({
        field: `parameters.${param.key}`,
        message: `Parameter '${param.key}' has no value`,
        suggestion: 'Ensure this parameter has a valid value or remove it',
      });
    }
  }

  private buildValidationResult(
    errors: Array<{ field: string; message: string; code?: string }>,
    warnings: Array<{ field: string; message: string; suggestion?: string }>,
  ): RuleValidationResult {
    const result: RuleValidationResult = { valid: errors.length === 0 };

    if (errors.length > 0) {
      result.errors = errors;
    }

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }
}

/**
 * Advanced builder with additional helper methods for common patterns
 * @since 10.6
 */
export class AdvancedCustomRuleBuilder extends CreateCustomRuleV2Builder {
  /**
   * Configure rule for security vulnerabilities
   * @param severity - Security impact severity
   * @returns Builder instance for chaining
   */
  forSecurityVulnerability(_severity: ImpactSeverity = 'HIGH'): this {
    return this.withStatus('READY').withParameter('category', 'SECURITY');
  }

  /**
   * Configure rule for code maintainability
   * @param severity - Maintainability impact severity
   * @returns Builder instance for chaining
   */
  forMaintainability(_severity: ImpactSeverity = 'MEDIUM'): this {
    return this.withStatus('READY').withParameter('category', 'MAINTAINABILITY');
  }

  /**
   * Configure rule for reliability bugs
   * @param severity - Reliability impact severity
   * @returns Builder instance for chaining
   */
  forReliability(_severity: ImpactSeverity = 'HIGH'): this {
    return this.withStatus('READY').withParameter('category', 'RELIABILITY');
  }

  /**
   * Set common security-related parameters
   * @param cwe - CWE identifier
   * @param owasp - OWASP category
   * @returns Builder instance for chaining
   */
  withSecurityStandards(cwe?: string, owasp?: string): this {
    if (cwe !== undefined && cwe !== '') {
      this.withParameter('cwe', cwe);
    }
    if (owasp !== undefined && owasp !== '') {
      this.withParameter('owasp', owasp);
    }
    return this;
  }

  /**
   * Configure rule with regex pattern
   * @param pattern - Regular expression pattern
   * @param flags - Regex flags (g, i, m, etc.)
   * @returns Builder instance for chaining
   */
  withRegexPattern(pattern: string, flags?: string): this {
    this.withParameter('pattern', pattern);
    if (flags !== undefined && flags !== '') {
      this.withParameter('flags', flags);
    }
    return this;
  }

  /**
   * Configure rule with XPath pattern
   * @param xpath - XPath expression
   * @returns Builder instance for chaining
   */
  withXPathPattern(xpath: string): this {
    return this.withParameter('xpath', xpath);
  }

  /**
   * Configure rule with file pattern
   * @param includes - File patterns to include (glob syntax)
   * @param excludes - File patterns to exclude (glob syntax)
   * @returns Builder instance for chaining
   */
  withFilePattern(includes?: string[], excludes?: string[]): this {
    if (includes && includes.length > 0) {
      this.withParameter('includes', includes.join(','));
    }
    if (excludes && excludes.length > 0) {
      this.withParameter('excludes', excludes.join(','));
    }
    return this;
  }

  /**
   * Set message template for issues
   * @param message - Issue message template (can include placeholders)
   * @returns Builder instance for chaining
   */
  withMessageTemplate(message: string): this {
    return this.withParameter('message', message);
  }

  /**
   * Enable or disable the rule
   * @param enabled - Whether the rule should be enabled
   * @returns Builder instance for chaining
   */
  setEnabled(enabled: boolean): this {
    return this.withStatus(enabled ? 'READY' : 'DEPRECATED');
  }

  /**
   * Mark rule as beta/experimental
   * @returns Builder instance for chaining
   */
  markAsBeta(): this {
    return this.withStatus('BETA');
  }

  /**
   * Mark rule as deprecated
   * @param reason - Deprecation reason
   * @param alternative - Alternative rule to use
   * @returns Builder instance for chaining
   */
  markAsDeprecated(reason?: string, alternative?: string): this {
    this.withStatus('DEPRECATED');
    if (reason !== undefined && reason !== '') {
      this.withParameter('deprecationReason', reason);
    }
    if (alternative !== undefined && alternative !== '') {
      this.withParameter('alternativeRule', alternative);
    }
    return this;
  }

  /**
   * Configure rule for specific frameworks
   * @param frameworks - List of framework names
   * @returns Builder instance for chaining
   */
  forFrameworks(frameworks: string[]): this {
    return this.withParameter('frameworks', frameworks.join(','));
  }

  /**
   * Set rule scope (main code, test code, or both)
   * @param scope - Code scope
   * @returns Builder instance for chaining
   */
  withScope(scope: 'MAIN' | 'TEST' | 'ALL'): this {
    return this.withParameter('scope', scope);
  }

  /**
   * Add tags for categorization
   * @param tags - List of tags
   * @returns Builder instance for chaining
   */
  withTags(tags: string[]): this {
    return this.withParameter('tags', tags.join(','));
  }

  /**
   * Set remediation effort estimate
   * @param effort - Effort in minutes
   * @returns Builder instance for chaining
   */
  withRemediationEffort(effort: number): this {
    return this.withParameter('remediationEffort', `${effort.toString()}min`);
  }

  /**
   * Create a copy of the current builder state
   * @returns New builder instance with copied state
   */
  clone(): AdvancedCustomRuleBuilder {
    const newBuilder = new AdvancedCustomRuleBuilder(this.executor);
    newBuilder.params = { ...this.params };
    if (this.params.parameters) {
      newBuilder.params.parameters = [...this.params.parameters];
    }
    return newBuilder;
  }
}
