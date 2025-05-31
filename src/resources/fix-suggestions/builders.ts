/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseBuilder } from '../../core/builders/BaseBuilder';
import { ValidationError } from '../../errors';
import type { FixSuggestionsClient } from './FixSuggestionsClient';
import type {
  GetIssueAvailabilityV2Request,
  FixSuggestionAvailabilityV2Response,
  RequestAiSuggestionsV2Request,
  AiSuggestionResponseV2,
  GetIssueAvailabilityV2Builder,
  RequestAiSuggestionsV2Builder,
} from './types';

/**
 * Builder for checking AI fix suggestion availability
 * @since 10.7
 */
export class GetIssueAvailabilityV2BuilderImpl
  extends BaseBuilder<GetIssueAvailabilityV2Request, FixSuggestionAvailabilityV2Response>
  implements GetIssueAvailabilityV2Builder
{
  constructor(client: FixSuggestionsClient) {
    super(async (params: GetIssueAvailabilityV2Request) => client.getIssueAvailabilityV2(params));
  }

  /**
   * Set the issue key
   */
  withIssue(issueKey: string): this {
    this.params.issueKey = issueKey;
    return this;
  }

  /**
   * Set project context
   */
  inProject(projectKey: string): this {
    this.params.projectKey = projectKey;
    return this;
  }

  /**
   * Set branch context
   */
  onBranch(branch: string): this {
    this.params.branch = branch;
    return this;
  }

  /**
   * Set pull request context
   */
  onPullRequest(pullRequest: string): this {
    this.params.pullRequest = pullRequest;
    return this;
  }

  /**
   * Validate parameters before execution
   */
  protected validate(): void {
    if (!this.params.issueKey) {
      throw new ValidationError('Issue key is required');
    }

    if (this.params.issueKey.trim().length === 0) {
      throw new ValidationError('Issue key cannot be empty');
    }

    // Validate branch and pull request are not both specified
    if (this.params.branch && this.params.pullRequest) {
      throw new ValidationError('Cannot specify both branch and pull request');
    }
  }

  /**
   * Execute the availability check request
   */
  async execute(): Promise<FixSuggestionAvailabilityV2Response> {
    this.validate();
    return this.executor(this.params as GetIssueAvailabilityV2Request);
  }
}

/**
 * Builder for requesting AI fix suggestions
 * @since 10.7
 */
export class RequestAiSuggestionsV2BuilderImpl
  extends BaseBuilder<RequestAiSuggestionsV2Request, AiSuggestionResponseV2>
  implements RequestAiSuggestionsV2Builder
{
  constructor(client: FixSuggestionsClient) {
    super(async (params: RequestAiSuggestionsV2Request) => client.requestAiSuggestionsV2(params));
    // Set sensible defaults
    this.params.includeContext = true;
    this.params.maxAlternatives = 3;
    this.params.fixStyle = 'comprehensive';
    this.params.priority = 'normal';
  }

  /**
   * Set the issue key
   */
  withIssue(issueKey: string): this {
    this.params.issueKey = issueKey;
    return this;
  }

  /**
   * Include surrounding code context
   */
  withContext(include = true): this {
    this.params.includeContext = include;
    return this;
  }

  /**
   * Set maximum number of alternatives
   */
  withMaxAlternatives(count: number): this {
    if (count < 1 || count > 10) {
      throw new ValidationError('Max alternatives must be between 1 and 10');
    }
    this.params.maxAlternatives = count;
    return this;
  }

  /**
   * Set fix style preference
   */
  withFixStyle(style: 'minimal' | 'comprehensive' | 'defensive'): this {
    this.params.fixStyle = style;
    return this;
  }

  /**
   * Add language-specific preferences
   */
  withLanguagePreferences(prefs: Record<string, unknown>): this {
    this.params.languagePreferences = {
      ...this.params.languagePreferences,
      ...prefs,
    };
    return this;
  }

  /**
   * Add custom context or instructions
   */
  withCustomContext(context: string): this {
    if (context.trim().length === 0) {
      throw new ValidationError('Custom context cannot be empty');
    }
    this.params.customContext = context;
    return this;
  }

  /**
   * Set priority level
   */
  withPriority(priority: 'low' | 'normal' | 'high'): this {
    this.params.priority = priority;
    return this;
  }

  /**
   * Validate parameters before execution
   */
  protected validate(): void {
    if (!this.params.issueKey) {
      throw new ValidationError('Issue key is required');
    }

    if (this.params.issueKey.trim().length === 0) {
      throw new ValidationError('Issue key cannot be empty');
    }

    if (this.params.maxAlternatives && this.params.maxAlternatives > 10) {
      throw new ValidationError('Maximum 10 alternatives allowed');
    }

    if (this.params.maxAlternatives && this.params.maxAlternatives < 1) {
      throw new ValidationError('At least 1 alternative required');
    }

    // Validate custom context length
    if (this.params.customContext && this.params.customContext.length > 1000) {
      throw new ValidationError('Custom context cannot exceed 1000 characters');
    }
  }

  /**
   * Execute the AI suggestions request
   */
  async execute(): Promise<AiSuggestionResponseV2> {
    this.validate();
    return this.executor(this.params as RequestAiSuggestionsV2Request);
  }
}
