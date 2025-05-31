import { BaseClient } from '../../core/BaseClient';
import { CreateCustomRuleV2Builder, AdvancedCustomRuleBuilder } from './builders';
import {
  CleanCodePolicyErrorCode,
  type CreateCustomRuleV2Request,
  type CreateCustomRuleV2Response,
  type ValidateCustomRuleOptions,
  type RuleValidationResult,
  type ListRuleTemplatesOptions,
  type RuleTemplate,
} from './types';

/**
 * Client for interacting with the SonarQube Clean Code Policy API v2
 *
 * The Clean Code Policy API enables organizations to create and manage custom
 * code quality rules based on templates. This allows teams to enforce
 * organization-specific coding standards and compliance requirements.
 *
 * @since 10.6
 * @requires Permission: Administer Quality Profiles
 *
 * @example
 * ```typescript
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Create a custom rule from a template
 * const rule = await client.cleanCodePolicy
 *   .createRule()
 *   .withKey('custom-no-console')
 *   .fromTemplate('javascript:S1234')
 *   .withName('No console.log in production')
 *   .withDescription('Console logging should not be used in production code')
 *   .withParameter('message', 'Remove console.log statement')
 *   .execute();
 * ```
 */
export class CleanCodePolicyClient extends BaseClient {
  /**
   * Create a custom rule using the v2 API
   *
   * @param request - Rule creation request
   * @returns Promise resolving to the created rule
   * @throws {CleanCodePolicyError} If rule creation fails
   *
   * @example
   * ```typescript
   * const rule = await client.cleanCodePolicy.createCustomRuleV2({
   *   key: 'no-console',
   *   templateKey: 'javascript:S1234',
   *   name: 'No console.log',
   *   markdownDescription: '## Why?\nConsole logs should not be in production',
   *   status: 'READY',
   *   parameters: [
   *     { key: 'message', value: 'Remove console statement' }
   *   ]
   * });
   * ```
   */
  async createCustomRuleV2(
    request: CreateCustomRuleV2Request
  ): Promise<CreateCustomRuleV2Response> {
    try {
      const response = await this.request<CreateCustomRuleV2Response>(
        '/api/v2/clean-code-policy/rules',
        {
          method: 'POST',
          headers: {
            contentType: 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      return response;
    } catch (error) {
      throw this.handleCleanCodePolicyError(error);
    }
  }

  /**
   * Create a builder for fluent rule creation
   *
   * @returns Rule creation builder
   *
   * @example
   * ```typescript
   * const rule = await client.cleanCodePolicy
   *   .createRule()
   *   .withKey('avoid-var')
   *   .fromTemplate('javascript:S1234')
   *   .withName('Avoid var declarations')
   *   .withDescription('Use const or let instead of var')
   *   .withParameter('message', 'Replace var with const or let')
   *   .execute();
   * ```
   */
  createRule(): CreateCustomRuleV2Builder {
    return new CreateCustomRuleV2Builder(async (request) => this.createCustomRuleV2(request));
  }

  /**
   * Create an advanced builder with additional helper methods
   *
   * @returns Advanced rule creation builder
   *
   * @example
   * ```typescript
   * const rule = await client.cleanCodePolicy
   *   .createAdvancedRule()
   *   .withKey('sql-injection')
   *   .fromTemplate('java:S3649')
   *   .withName('Prevent SQL Injection')
   *   .withDescription('Detects potential SQL injection vulnerabilities')
   *   .forSecurityVulnerability('HIGH')
   *   .withSecurityStandards('CWE-89', 'A03')
   *   .withRegexPattern('executeQuery\\s*\\([^)]*\\+', 'gm')
   *   .execute();
   * ```
   */
  createAdvancedRule(): AdvancedCustomRuleBuilder {
    return new AdvancedCustomRuleBuilder(async (request) => this.createCustomRuleV2(request));
  }

  /**
   * Validate a rule configuration without creating it
   *
   * @param request - Rule configuration to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const validation = await client.cleanCodePolicy.validateRule({
   *   key: 'my-rule',
   *   templateKey: 'javascript:S1234',
   *   name: 'My Custom Rule',
   *   markdownDescription: 'Rule description'
   * });
   *
   * if (!validation.valid) {
   *   console.error('Validation errors:', validation.errors);
   * }
   * ```
   */
  async validateRule(
    request: CreateCustomRuleV2Request,
    options?: ValidateCustomRuleOptions
  ): Promise<RuleValidationResult> {
    const builder = new CreateCustomRuleV2Builder(async () =>
      Promise.resolve({} as CreateCustomRuleV2Response)
    );

    // Set all parameters from the request
    if (request.key) {
      builder.withKey(request.key);
    }
    if (request.templateKey) {
      builder.fromTemplate(request.templateKey);
    }
    if (request.name) {
      builder.withName(request.name);
    }
    if (request.markdownDescription) {
      builder.withDescription(request.markdownDescription);
    }
    if (request.status) {
      builder.withStatus(request.status);
    }
    if (request.parameters) {
      builder.withParameters(request.parameters);
    }

    return builder.validate(options);
  }

  /**
   * List available rule templates (placeholder - not in v2 API yet)
   *
   * NOTE: This method is a placeholder for future API expansion.
   * Currently, templates must be discovered through the v1 Rules API.
   *
   * @param options - Options for filtering templates
   * @returns Promise resolving to rule templates
   *
   * @example
   * ```typescript
   * // This is a conceptual example - actual implementation pending
   * const templates = await client.cleanCodePolicy.listTemplates({
   *   language: 'javascript',
   *   customizable: true
   * });
   * ```
   */
  async listTemplates(_options?: ListRuleTemplatesOptions): Promise<RuleTemplate[]> {
    // This is a placeholder for future API expansion
    // Currently, rule templates must be fetched through the v1 Rules API
    return Promise.reject(
      new Error(
        'Template listing is not yet available in the v2 API. ' +
          'Use the v1 Rules API with is_template=true parameter.'
      )
    );
  }

  /**
   * Get a specific rule template by key (placeholder - not in v2 API yet)
   *
   * NOTE: This method is a placeholder for future API expansion.
   * Currently, templates must be fetched through the v1 Rules API.
   *
   * @param templateKey - Template key
   * @returns Promise resolving to the template
   *
   * @example
   * ```typescript
   * // This is a conceptual example - actual implementation pending
   * const template = await client.cleanCodePolicy.getTemplate('javascript:S1234');
   * ```
   */
  async getTemplate(_templateKey: string): Promise<RuleTemplate> {
    // This is a placeholder for future API expansion
    return Promise.reject(
      new Error(
        'Template fetching is not yet available in the v2 API. ' +
          'Use the v1 Rules API to fetch template details.'
      )
    );
  }

  /**
   * Create a batch of rules efficiently
   *
   * @param rules - Array of rule configurations
   * @returns Promise resolving to created rules and any errors
   *
   * @example
   * ```typescript
   * const results = await client.cleanCodePolicy.createBatch([
   *   {
   *     key: 'rule1',
   *     templateKey: 'javascript:S1234',
   *     name: 'Rule 1',
   *     markdownDescription: 'Description 1'
   *   },
   *   {
   *     key: 'rule2',
   *     templateKey: 'javascript:S5678',
   *     name: 'Rule 2',
   *     markdownDescription: 'Description 2'
   *   }
   * ]);
   *
   * console.log(`Created: ${results.created.length}, Failed: ${results.failed.length}`);
   * ```
   */
  async createBatch(rules: CreateCustomRuleV2Request[]): Promise<{
    created: CreateCustomRuleV2Response[];
    failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }>;
  }> {
    const created: CreateCustomRuleV2Response[] = [];
    const failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }> = [];

    // Process rules in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks: CreateCustomRuleV2Request[][] = [];

    for (let i = 0; i < rules.length; i += concurrencyLimit) {
      chunks.push(rules.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (rule) => {
        try {
          const result = await this.createCustomRuleV2(rule);
          created.push(result);
        } catch (error) {
          failed.push({
            rule,
            error: error as Error,
          });
        }
      });

      await Promise.all(promises);
    }

    return { created, failed };
  }

  /**
   * Import rules from a JSON export
   *
   * @param jsonData - JSON string containing exported rules
   * @param options - Import options
   * @returns Promise resolving to import results
   *
   * @example
   * ```typescript
   * const exportedRules = await fs.readFile('rules.json', 'utf-8');
   * const results = await client.cleanCodePolicy.importRules(exportedRules, {
   *   skipExisting: true,
   *   validateBeforeImport: true
   * });
   * ```
   */
  async importRules(
    jsonData: string,
    options?: {
      skipExisting?: boolean;
      validateBeforeImport?: boolean;
      keyPrefix?: string;
    }
  ): Promise<{
    imported: CreateCustomRuleV2Response[];
    skipped: string[];
    failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }>;
  }> {
    const rules = this.parseRulesFromJson(jsonData);
    const processedRules = this.addKeyPrefixToRules(rules, options?.keyPrefix);

    if (options?.validateBeforeImport === true) {
      await this.validateRulesBeforeImport(processedRules);
    }

    return this.processRulesImport(processedRules, options?.skipExisting);
  }

  /**
   * Export rules to JSON format
   *
   * @param rules - Rules to export
   * @returns JSON string containing exported rules
   *
   * @example
   * ```typescript
   * const rules = [createdRule1, createdRule2];
   * const exportData = client.cleanCodePolicy.exportRules(rules);
   * await fs.writeFile('rules.json', exportData);
   * ```
   */
  exportRules(rules: CreateCustomRuleV2Response[]): string {
    // Convert response format to request format for re-import
    const exportData = rules.map((rule) => ({
      key: rule.key,
      templateKey: rule.templateKey ?? '',
      name: rule.name,
      markdownDescription: rule.markdownDescription ?? '',
      status: rule.status,
      parameters:
        rule.parameters?.map((p) => ({
          key: p.key,
          value: p.defaultValue ?? '',
        })) ?? [],
    }));

    return JSON.stringify(exportData, null, 2);
  }

  private parseRulesFromJson(jsonData: string): CreateCustomRuleV2Request[] {
    try {
      const rules = JSON.parse(jsonData) as CreateCustomRuleV2Request[];
      if (!Array.isArray(rules)) {
        throw new Error('Expected an array of rules');
      }
      return rules;
    } catch (error) {
      throw new Error(`Invalid JSON data: ${(error as Error).message}`);
    }
  }

  private addKeyPrefixToRules(
    rules: CreateCustomRuleV2Request[],
    keyPrefix?: string
  ): CreateCustomRuleV2Request[] {
    if (keyPrefix === undefined || keyPrefix === '') {
      return rules;
    }

    return rules.map((rule) => ({
      ...rule,
      key: `${keyPrefix}${rule.key}`,
    }));
  }

  private async validateRulesBeforeImport(rules: CreateCustomRuleV2Request[]): Promise<void> {
    for (const rule of rules) {
      const validation = await this.validateRule(rule);
      if (!validation.valid && validation.errors) {
        throw new Error(
          `Validation failed for rule ${rule.key}: ${validation.errors.map((e) => e.message).join(', ')}`
        );
      }
    }
  }

  private async processRulesImport(
    rules: CreateCustomRuleV2Request[],
    skipExisting?: boolean
  ): Promise<{
    imported: CreateCustomRuleV2Response[];
    skipped: string[];
    failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }>;
  }> {
    const imported: CreateCustomRuleV2Response[] = [];
    const skipped: string[] = [];
    const failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }> = [];

    for (const rule of rules) {
      try {
        const result = await this.createCustomRuleV2(rule);
        imported.push(result);
      } catch (error) {
        this.handleRuleImportError(error, rule, skipExisting, skipped, failed);
      }
    }

    return { imported, skipped, failed };
  }

  private handleRuleImportError(
    error: unknown,
    rule: CreateCustomRuleV2Request,
    skipExisting: boolean | undefined,
    skipped: string[],
    failed: Array<{ rule: CreateCustomRuleV2Request; error: Error }>
  ): void {
    const err = error as Error & { code?: string };
    const shouldSkipExisting =
      skipExisting === true && err.code === (CleanCodePolicyErrorCode.RuleKeyExists as string);

    if (shouldSkipExisting) {
      skipped.push(rule.key);
    } else {
      failed.push({ rule, error: err });
    }
  }

  /**
   * Handle Clean Code Policy API specific errors
   *
   * @param error - The error to handle
   * @returns Formatted error with proper type
   * @private
   */
  private handleCleanCodePolicyError(error: unknown): Error {
    if (!(error instanceof Error)) {
      return error as Error;
    }

    const message = error.message.toLowerCase();
    const errorStr = error.toString().toLowerCase();

    if (this.isRuleKeyExistsError(message, errorStr)) {
      return this.createError(
        CleanCodePolicyErrorCode.RuleKeyExists,
        'A rule with this key already exists',
        error
      );
    }

    if (this.isTemplateNotFoundError(message, errorStr)) {
      return this.createError(
        CleanCodePolicyErrorCode.TemplateNotFound,
        'The specified template was not found',
        error
      );
    }

    const parameterError = this.checkParameterErrors(message, errorStr, error);
    if (parameterError) {
      return parameterError;
    }

    if (this.isPermissionError(message, errorStr)) {
      return this.createError(
        CleanCodePolicyErrorCode.InsufficientPermissions,
        'Insufficient permissions to create custom rules. Requires "Administer Quality Profiles" permission.',
        error
      );
    }

    return error;
  }

  private isRuleKeyExistsError(message: string, errorStr: string): boolean {
    return message.includes('already exists') || errorStr.includes('already exists');
  }

  private isTemplateNotFoundError(message: string, errorStr: string): boolean {
    return (
      (message.includes('template') && message.includes('not found')) ||
      (errorStr.includes('template') && errorStr.includes('not found'))
    );
  }

  private checkParameterErrors(message: string, errorStr: string, error: Error): Error | null {
    if (!message.includes('parameter') && !errorStr.includes('parameter')) {
      return null;
    }

    if (message.includes('invalid') || errorStr.includes('invalid')) {
      return this.createError(
        CleanCodePolicyErrorCode.InvalidParameter,
        'Invalid parameter value provided',
        error
      );
    }

    if (this.isMissingParameterError(message, errorStr)) {
      return this.createError(
        CleanCodePolicyErrorCode.MissingParameter,
        'Required parameter is missing',
        error
      );
    }

    return null;
  }

  private isMissingParameterError(message: string, errorStr: string): boolean {
    return (
      message.includes('missing') ||
      message.includes('required') ||
      errorStr.includes('missing') ||
      errorStr.includes('required')
    );
  }

  private isPermissionError(message: string, errorStr: string): boolean {
    return (
      message.includes('permission') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      errorStr.includes('permission') ||
      errorStr.includes('forbidden')
    );
  }

  /**
   * Create a typed error object
   *
   * @param code - Error code
   * @param message - Error message
   * @param originalError - Original error object
   * @returns Typed error
   * @private
   */
  private createError(
    code: CleanCodePolicyErrorCode,
    message: string,
    originalError?: Error
  ): Error {
    const error = new Error(message) as Error & { code?: string; originalError?: Error };
    error.code = code;
    if (originalError) {
      error.originalError = originalError;
    }
    return error;
  }
}
