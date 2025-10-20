/**
 * SonarQube Fix Suggestions API v2
 * AI-powered code fix suggestions for SonarQube issues
 *
 * @since 10.7
 */

// Re-export all types
export type * from './types.js';

// Re-export client class
export { FixSuggestionsClient } from './FixSuggestionsClient.js';

// Re-export builders
export {
  GetIssueAvailabilityV2BuilderImpl,
  RequestAiSuggestionsV2BuilderImpl,
} from './builders.js';

// Re-export utilities
export { FixSuggestionUtils, FixSuggestionIntegration } from './utils.js';
