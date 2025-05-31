/**
 * Types for the SonarQube Fix Suggestions API v2.
 * This API provides AI-powered code fix suggestions for SonarQube issues.
 *
 * @since 10.7
 */

// ===== Core Request/Response Types =====

/**
 * Request parameters for checking AI fix suggestion availability
 * @since 10.7
 */
export interface GetIssueAvailabilityV2Request {
  /** Issue key or UUID */
  issueKey: string;
  /** Optional project context */
  projectKey?: string;
  /** Branch context for multi-branch projects */
  branch?: string;
  /** Pull request context */
  pullRequest?: string;
}

/**
 * Response indicating whether AI suggestions are available for an issue
 * @since 10.7
 */
export interface FixSuggestionAvailabilityV2Response {
  /** Whether AI suggestions are available for this issue */
  available: boolean;
  /** Reason if not available */
  reason?:
    | 'unsupported_rule'
    | 'language_not_supported'
    | 'ai_service_unavailable'
    | 'quota_exceeded'
    | 'issue_already_resolved';
  /** Estimated processing time in seconds */
  estimatedProcessingTime?: number;
  /** AI model information */
  aiModel?: {
    name: string;
    version: string;
    capabilities: string[];
    supportedLanguages: string[];
  };
  /** Rate limiting information */
  rateLimiting?: {
    requestsRemaining: number;
    resetTime: string;
    dailyQuota: number;
  };
}

/**
 * Request parameters for AI fix suggestions
 * @since 10.7
 */
export interface RequestAiSuggestionsV2Request {
  /** Issue key or UUID */
  issueKey: string;
  /** Include surrounding code context */
  includeContext?: boolean;
  /** Number of alternative fixes to generate (1-10) */
  maxAlternatives?: number;
  /** Preferred fix style */
  fixStyle?: 'minimal' | 'comprehensive' | 'defensive';
  /** Language-specific preferences */
  languagePreferences?: Record<string, unknown>;
  /** Custom context or instructions for AI */
  customContext?: string;
  /** Priority level for fix generation */
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Complete AI suggestion response with metadata
 * @since 10.7
 */
export interface AiSuggestionResponseV2 {
  /** Unique suggestion session ID */
  sessionId: string;
  /** Issue information */
  issue: {
    key: string;
    rule: string;
    severity: string;
    type: string;
    message: string;
    component: string;
    line?: number;
    textRange?: {
      startLine: number;
      endLine: number;
      startOffset: number;
      endOffset: number;
    };
  };
  /** Generated fix suggestions */
  suggestions: AiFixSuggestionV2[];
  /** AI processing metadata */
  metadata: {
    processingTime: number;
    modelUsed: string;
    confidenceThreshold: number;
    contextAnalyzed: boolean;
    requestTimestamp: string;
    responseTimestamp: string;
  };
  /** Rate limiting information */
  rateLimiting?: {
    requestsRemaining: number;
    resetTime: string;
  };
}

/**
 * Individual AI fix suggestion
 * @since 10.7
 */
export interface AiFixSuggestionV2 {
  /** Unique suggestion ID */
  id: string;
  /** Human-readable explanation */
  explanation: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Fix complexity rating */
  complexity: 'low' | 'medium' | 'high';
  /** Estimated fix success rate (0-100) */
  successRate: number;
  /** Estimated effort to apply fix */
  effortEstimate: 'trivial' | 'easy' | 'moderate' | 'complex';
  /** Code changes */
  changes: AiCodeChangeV2[];
  /** Additional context or warnings */
  notes?: string[];
  /** Related documentation links */
  references?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'best_practice' | 'example' | 'rule_description';
  }>;
  /** Alternative approaches if this fix doesn't work */
  alternatives?: Array<{
    description: string;
    confidence: number;
    changes: AiCodeChangeV2[];
  }>;
  /** Testing recommendations */
  testingGuidance?: {
    suggestedTests: string[];
    riskAreas: string[];
    verificationSteps: string[];
  };
}

/**
 * Code change specification for AI suggestions
 * @since 10.7
 */
export interface AiCodeChangeV2 {
  /** File path relative to project root */
  filePath: string;
  /** Original file content hash for validation */
  originalHash?: string;
  /** Line-based changes */
  lineChanges: Array<{
    /** Start line number (1-indexed) */
    startLine: number;
    /** End line number (1-indexed) */
    endLine: number;
    /** Original content being replaced */
    originalContent: string;
    /** New content to insert */
    newContent: string;
    /** Type of change */
    changeType: 'replace' | 'insert' | 'delete' | 'move';
    /** Explanation for this specific change */
    changeReason?: string;
    /** Confidence for this specific change (0-100) */
    changeConfidence?: number;
  }>;
  /** File-level metadata */
  fileMetadata?: {
    language: string;
    encoding: string;
    totalLines: number;
    lastModified?: string;
  };
  /** Import or dependency changes */
  dependencies?: Array<{
    type: 'add' | 'remove' | 'update';
    name: string;
    version?: string;
    reason: string;
  }>;
}

// ===== Builder Pattern Types =====

/**
 * Builder interface for checking issue availability
 * @since 10.7
 */
export interface GetIssueAvailabilityV2Builder {
  /** Set the issue key */
  withIssue: (issueKey: string) => this;
  /** Set project context */
  inProject: (projectKey: string) => this;
  /** Set branch context */
  onBranch: (branch: string) => this;
  /** Set pull request context */
  onPullRequest: (pullRequest: string) => this;
  /** Execute the request */
  execute: () => Promise<FixSuggestionAvailabilityV2Response>;
}

/**
 * Builder interface for requesting AI suggestions
 * @since 10.7
 */
export interface RequestAiSuggestionsV2Builder {
  /** Set the issue key */
  withIssue: (issueKey: string) => this;
  /** Include surrounding code context */
  withContext: (include?: boolean) => this;
  /** Set maximum number of alternatives */
  withMaxAlternatives: (count: number) => this;
  /** Set fix style preference */
  withFixStyle: (style: 'minimal' | 'comprehensive' | 'defensive') => this;
  /** Add language-specific preferences */
  withLanguagePreferences: (prefs: Record<string, unknown>) => this;
  /** Add custom context or instructions */
  withCustomContext: (context: string) => this;
  /** Set priority level */
  withPriority: (priority: 'low' | 'normal' | 'high') => this;
  /** Execute the request */
  execute: () => Promise<AiSuggestionResponseV2>;
}

// ===== Utility and Analysis Types =====

/**
 * Options for applying fix suggestions
 * @since 10.7
 */
export interface FixApplicationOptions {
  /** Automatically create backup before applying */
  createBackup?: boolean;
  /** Validation mode */
  validationMode?: 'strict' | 'permissive';
  /** Handle conflicts */
  conflictResolution?: 'abort' | 'skip' | 'interactive';
  /** Dry run mode (don't actually apply changes) */
  dryRun?: boolean;
  /** Custom validation rules */
  customValidation?: (change: AiCodeChangeV2) => boolean;
}

/**
 * Result of fix validation
 * @since 10.7
 */
export interface FixValidationResult {
  /** Whether the fix can be safely applied */
  canApply: boolean;
  /** List of issues preventing application */
  blockers: Array<{
    type: 'file_modified' | 'syntax_error' | 'conflict' | 'permission' | 'validation_failed';
    message: string;
    filePath?: string;
    lineNumber?: number;
    severity: 'error' | 'warning';
  }>;
  /** Warnings that don't prevent application */
  warnings: string[];
  /** Estimated impact assessment */
  impact?: {
    filesAffected: number;
    linesChanged: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTime: string;
  };
}

/**
 * Fix suggestion ranking criteria
 * @since 10.7
 */
export interface FixRankingCriteria {
  /** Weight for confidence score (0-1) */
  confidenceWeight?: number;
  /** Weight for success rate (0-1) */
  successRateWeight?: number;
  /** Weight for complexity (0-1, lower complexity preferred) */
  complexityWeight?: number;
  /** Weight for effort estimate (0-1, lower effort preferred) */
  effortWeight?: number;
  /** Preferred fix styles (ordered by preference) */
  preferredStyles?: Array<'minimal' | 'comprehensive' | 'defensive'>;
}

/**
 * AI model capabilities and limitations
 * @since 10.7
 */
export interface AiModelCapabilities {
  /** Supported programming languages */
  supportedLanguages: string[];
  /** Supported rule types */
  supportedRuleTypes: string[];
  /** Maximum context size in tokens */
  maxContextSize: number;
  /** Maximum number of alternatives per request */
  maxAlternatives: number;
  /** Rate limits */
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  /** Model version and capabilities */
  version: string;
  /** Training data cutoff date */
  trainingCutoff?: string;
}

/**
 * Fix suggestion statistics and analytics
 * @since 10.7
 */
export interface FixSuggestionStats {
  /** Total suggestions generated */
  totalSuggestions: number;
  /** Suggestions by confidence level */
  byConfidence: {
    high: number; // 80-100%
    medium: number; // 50-79%
    low: number; // 0-49%
  };
  /** Suggestions by complexity */
  byComplexity: {
    low: number;
    medium: number;
    high: number;
  };
  /** Success rate statistics */
  successRates: {
    average: number;
    median: number;
    standardDeviation: number;
  };
  /** Most common fix patterns */
  commonPatterns: Array<{
    pattern: string;
    frequency: number;
    averageConfidence: number;
  }>;
}

// ===== Error Types =====

/**
 * AI service specific error information
 * @since 10.7
 */
export interface AiServiceError {
  /** Error type */
  type: 'quota_exceeded' | 'service_unavailable' | 'model_error' | 'timeout' | 'invalid_input';
  /** Human-readable error message */
  message: string;
  /** Retry information */
  retry?: {
    canRetry: boolean;
    retryAfter?: number; // seconds
    maxRetries?: number;
  };
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Fix generation failure details
 * @since 10.7
 */
export interface FixGenerationFailure {
  /** Issue that failed to generate fixes */
  issueKey: string;
  /** Failure reason */
  reason: string;
  /** Error code */
  errorCode: string;
  /** Suggested actions */
  suggestedActions: string[];
  /** Whether retry is recommended */
  retryRecommended: boolean;
}

// ===== Integration Types =====

/**
 * Integration options with Issues API
 * @since 10.7
 */
export interface IssueIntegrationOptions {
  /** Automatically check fix availability when loading issues */
  autoCheckAvailability?: boolean;
  /** Cache availability results for performance */
  cacheAvailability?: boolean;
  /** Cache duration in minutes */
  cacheDuration?: number;
  /** Filter criteria for eligible issues */
  eligibilityCriteria?: {
    severity?: string[];
    types?: string[];
    age?: number; // days
    hasLocation?: boolean;
  };
}

/**
 * Batch processing options for multiple issues
 * @since 10.7
 */
export interface BatchProcessingOptions {
  /** Maximum concurrent requests */
  concurrency?: number;
  /** Delay between requests (ms) */
  requestDelay?: number;
  /** Continue on individual failures */
  continueOnError?: boolean;
  /** Progress callback */
  onProgress?: (progress: {
    completed: number;
    total: number;
    current?: string;
    errors: number;
  }) => void;
}

/**
 * Result of batch fix suggestion processing
 * @since 10.7
 */
export interface BatchFixResult {
  /** Successfully processed issues */
  successful: Array<{
    issueKey: string;
    suggestions: AiFixSuggestionV2[];
    processingTime: number;
  }>;
  /** Failed issues with error details */
  failed: Array<{
    issueKey: string;
    error: string;
    errorType: string;
    retryable: boolean;
  }>;
  /** Overall statistics */
  summary: {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    totalProcessingTime: number;
    averageConfidence: number;
  };
}

// ===== Export convenience type unions =====

export type FixSuggestionUnavailableReason =
  | 'unsupported_rule'
  | 'language_not_supported'
  | 'ai_service_unavailable'
  | 'quota_exceeded'
  | 'issue_already_resolved';

export type FixStyle = 'minimal' | 'comprehensive' | 'defensive';

export type FixComplexity = 'low' | 'medium' | 'high';

export type FixEffort = 'trivial' | 'easy' | 'moderate' | 'complex';

export type ChangeType = 'replace' | 'insert' | 'delete' | 'move';

export type ValidationMode = 'strict' | 'permissive';

export type ConflictResolution = 'abort' | 'skip' | 'interactive';

export type Priority = 'low' | 'normal' | 'high';

export type RiskLevel = 'low' | 'medium' | 'high';
