import { BaseClient } from '../../core/BaseClient';
import { GetIssueAvailabilityV2BuilderImpl, RequestAiSuggestionsV2BuilderImpl } from './builders';
import type {
  GetIssueAvailabilityV2Request,
  FixSuggestionAvailabilityV2Response,
  RequestAiSuggestionsV2Request,
  AiSuggestionResponseV2,
  GetIssueAvailabilityV2Builder,
  RequestAiSuggestionsV2Builder,
} from './types';

/**
 * Client for interacting with the SonarQube Fix Suggestions API v2.
 * This API provides AI-powered code fix suggestions for SonarQube issues.
 *
 * The Fix Suggestions API enables:
 * - Automated code fix generation using AI
 * - Issue-specific fix recommendations
 * - Multi-language support with context awareness
 * - Confidence scoring for fix reliability
 *
 * @since 10.7
 */
export class FixSuggestionsClient extends BaseClient {
  /**
   * Check if AI fix suggestions are available for a specific issue.
   *
   * @param params - Issue availability check parameters
   * @returns Availability status and AI model information
   * @since 10.7
   *
   * @example
   * ```typescript
   * // Check availability for a specific issue
   * const availability = await client.fixSuggestions.getIssueAvailabilityV2({
   *   issueKey: 'AY8qEqN7UVrTsQCOExjT',
   *   projectKey: 'my-project'
   * });
   *
   * if (availability.available) {
   *   console.log(`AI fixes available. Processing time: ${availability.estimatedProcessingTime}s`);
   * } else {
   *   console.log(`AI fixes not available: ${availability.reason}`);
   * }
   * ```
   */
  async getIssueAvailabilityV2(
    params: GetIssueAvailabilityV2Request
  ): Promise<FixSuggestionAvailabilityV2Response> {
    const query = this.buildV2Query(params as unknown as Record<string, unknown>);

    return this.request<FixSuggestionAvailabilityV2Response>(
      `/api/v2/fix-suggestions/issues?${query}`
    );
  }

  /**
   * Request AI-generated fix suggestions for an issue.
   *
   * @param params - AI suggestion request parameters
   * @returns AI-generated fix suggestions with code changes
   * @since 10.7
   *
   * @example
   * ```typescript
   * // Request AI suggestions with context
   * const suggestions = await client.fixSuggestions.requestAiSuggestionsV2({
   *   issueKey: 'AY8qEqN7UVrTsQCOExjT',
   *   includeContext: true,
   *   maxAlternatives: 3,
   *   fixStyle: 'comprehensive'
   * });
   *
   * console.log(`Generated ${suggestions.suggestions.length} fix suggestions`);
   *
   * suggestions.suggestions.forEach((suggestion, index) => {
   *   console.log(`Fix ${index + 1}: ${suggestion.explanation}`);
   *   console.log(`Confidence: ${suggestion.confidence}%`);
   *   console.log(`Changes: ${suggestion.changes.length} files`);
   * });
   * ```
   */
  async requestAiSuggestionsV2(
    params: RequestAiSuggestionsV2Request
  ): Promise<AiSuggestionResponseV2> {
    return this.request<AiSuggestionResponseV2>('/api/v2/fix-suggestions/ai-suggestions', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a builder for checking issue availability.
   *
   * @returns Issue availability builder
   * @since 10.7
   *
   * @example
   * ```typescript
   * const availability = await client.fixSuggestions
   *   .checkAvailability()
   *   .withIssue('AY8qEqN7UVrTsQCOExjT')
   *   .inProject('my-project')
   *   .onBranch('main')
   *   .execute();
   * ```
   */
  checkAvailability(): GetIssueAvailabilityV2Builder {
    return new GetIssueAvailabilityV2BuilderImpl(this);
  }

  /**
   * Create a builder for requesting AI suggestions.
   *
   * @returns AI suggestions request builder
   * @since 10.7
   *
   * @example
   * ```typescript
   * const suggestions = await client.fixSuggestions
   *   .requestSuggestions()
   *   .withIssue('AY8qEqN7UVrTsQCOExjT')
   *   .withContext(true)
   *   .withMaxAlternatives(5)
   *   .withFixStyle('comprehensive')
   *   .execute();
   * ```
   */
  requestSuggestions(): RequestAiSuggestionsV2Builder {
    return new RequestAiSuggestionsV2BuilderImpl(this);
  }
}
