/**
 * Utility functions for processing AI fix suggestions
 * @since 10.7
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */

import type { SonarQubeClient } from '../../index';
import type {
  AiFixSuggestionV2,
  FixApplicationOptions,
  FixValidationResult,
  FixRankingCriteria,
  FixSuggestionStats,
  BatchProcessingOptions,
  BatchFixResult,
  IssueIntegrationOptions,
  FixSuggestionAvailabilityV2Response,
} from './types';

/**
 * Utility class for processing and analyzing AI fix suggestions
 */

export class FixSuggestionUtils {
  /**
   * Validate that a fix suggestion can be safely applied to the current codebase
   *
   * @param suggestion - Fix suggestion to validate
   * @param options - Validation options
   * @returns Validation result with blockers and warnings
   *
   * @example
   * ```typescript
   * const validation = FixSuggestionUtils.validateFixApplication(suggestion, {
   *   validationMode: 'strict',
   *   createBackup: true
   * });
   *
   * if (validation.canApply) {
   *   console.log('Fix can be safely applied');
   * } else {
   *   console.error('Blockers:', validation.blockers);
   * }
   * ```
   */
  static validateFixApplication(
    suggestion: AiFixSuggestionV2,
    options: FixApplicationOptions = {},
  ): FixValidationResult {
    const result: FixValidationResult = {
      canApply: true,
      blockers: [],
      warnings: [],
    };

    // Validate each code change
    for (const change of suggestion.changes) {
      // Check if file exists and is accessible
      if (!this.isFileAccessible(change.filePath)) {
        result.blockers.push({
          type: 'permission',
          message: `Cannot access file: ${change.filePath}`,
          filePath: change.filePath,
          severity: 'error',
        });
      }

      // Validate line ranges
      for (const lineChange of change.lineChanges) {
        if (lineChange.startLine > lineChange.endLine) {
          result.blockers.push({
            type: 'syntax_error',
            message: `Invalid line range: ${lineChange.startLine}-${lineChange.endLine}`,
            filePath: change.filePath,
            lineNumber: lineChange.startLine,
            severity: 'error',
          });
        }

        if (lineChange.startLine < 1) {
          result.blockers.push({
            type: 'syntax_error',
            message: `Invalid start line: ${lineChange.startLine}`,
            filePath: change.filePath,
            lineNumber: lineChange.startLine,
            severity: 'error',
          });
        }

        // Check for potentially dangerous changes in strict mode
        if (options.validationMode === 'strict') {
          if (lineChange.newContent.includes('eval(') || lineChange.newContent.includes('exec(')) {
            result.blockers.push({
              type: 'validation_failed',
              message: 'Code contains potentially dangerous functions',
              filePath: change.filePath,
              lineNumber: lineChange.startLine,
              severity: 'error',
            });
          }
        }

        // Apply custom validation if provided
        if (options.customValidation && !options.customValidation(change)) {
          result.blockers.push({
            type: 'validation_failed',
            message: 'Custom validation failed',
            filePath: change.filePath,
            lineNumber: lineChange.startLine,
            severity: 'error',
          });
        }

        // Add warnings for low confidence changes
        if (lineChange.changeConfidence && lineChange.changeConfidence < 80) {
          result.warnings.push(
            `Low confidence change at ${change.filePath}:${lineChange.startLine} (${lineChange.changeConfidence}%)`,
          );
        }
      }
    }

    // Calculate impact
    const filesAffected = suggestion.changes.length;
    const linesChanged = suggestion.changes.reduce(
      (total, change) => total + change.lineChanges.length,
      0,
    );

    result.impact = {
      filesAffected,
      linesChanged,
      riskLevel: this.calculateRiskLevel(
        suggestion.confidence,
        suggestion.complexity,
        linesChanged,
      ),
      estimatedTime: this.estimateApplicationTime(suggestion.effortEstimate, linesChanged),
    };

    result.canApply = result.blockers.length === 0;
    return result;
  }

  /**
   * Rank fix suggestions by confidence and applicability
   *
   * @param suggestions - Array of fix suggestions to rank
   * @param criteria - Ranking criteria with weights
   * @returns Ranked suggestions (best first)
   *
   * @example
   * ```typescript
   * const ranked = FixSuggestionUtils.rankSuggestions(suggestions, {
   *   confidenceWeight: 0.4,
   *   successRateWeight: 0.3,
   *   complexityWeight: 0.2,
   *   effortWeight: 0.1
   * });
   *
   * console.log('Best suggestion:', ranked[0].explanation);
   * ```
   */
  static rankSuggestions(
    suggestions: AiFixSuggestionV2[],
    criteria: FixRankingCriteria = {},
  ): AiFixSuggestionV2[] {
    const weights = {
      confidenceWeight: criteria.confidenceWeight ?? 0.4,
      successRateWeight: criteria.successRateWeight ?? 0.3,
      complexityWeight: criteria.complexityWeight ?? 0.2,
      effortWeight: criteria.effortWeight ?? 0.1,
    };

    return suggestions
      .slice() // Don't mutate original array
      .sort((a, b) => {
        const scoreA = this.calculateSuggestionScore(a, weights);
        const scoreB = this.calculateSuggestionScore(b, weights);

        // Higher score is better
        return scoreB - scoreA;
      });
  }

  /**
   * Generate a preview of what changes would be applied
   *
   * @param suggestion - Fix suggestion to preview
   * @returns Human-readable preview text
   *
   * @example
   * ```typescript
   * const preview = FixSuggestionUtils.generateChangePreview(suggestion);
   * console.log(preview);
   * // Output:
   * // Fix: Use StringBuilder instead of string concatenation
   * // Confidence: 95% | Complexity: low
   * //
   * // File 1: src/main/java/App.java
   * //   Lines 42-42:
   * //   - String result = str1 + str2 + str3;
   * //   + String result = new StringBuilder()...
   * ```
   */
  static generateChangePreview(suggestion: AiFixSuggestionV2): string {
    const lines: string[] = [];

    lines.push(`Fix: ${suggestion.explanation}`);
    lines.push(
      `Confidence: ${suggestion.confidence}% | Complexity: ${suggestion.complexity} | Effort: ${suggestion.effortEstimate}`,
    );
    lines.push('');

    for (const [index, change] of suggestion.changes.entries()) {
      lines.push(`File ${index + 1}: ${change.filePath}`);

      for (const lineChange of change.lineChanges) {
        if (lineChange.startLine === lineChange.endLine) {
          lines.push(`  Line ${lineChange.startLine}:`);
        } else {
          lines.push(`  Lines ${lineChange.startLine}-${lineChange.endLine}:`);
        }

        // Show original content
        const originalLines = lineChange.originalContent.split('\n');
        for (const line of originalLines) {
          lines.push(`  - ${line}`);
        }

        // Show new content
        const newLines = lineChange.newContent.split('\n');
        for (const line of newLines) {
          lines.push(`  + ${line}`);
        }

        if (lineChange.changeReason) {
          lines.push(`    (${lineChange.changeReason})`);
        }
        lines.push('');
      }
    }

    // Add notes if present
    if (suggestion.notes && suggestion.notes.length > 0) {
      lines.push('Notes:');
      for (const note of suggestion.notes) {
        lines.push(`  • ${note}`);
      }
      lines.push('');
    }

    // Add testing guidance if present
    if (suggestion.testingGuidance) {
      lines.push('Testing Guidance:');
      if (suggestion.testingGuidance.suggestedTests.length > 0) {
        lines.push('  Suggested Tests:');
        for (const test of suggestion.testingGuidance.suggestedTests) {
          lines.push(`    • ${test}`);
        }
      }
      if (suggestion.testingGuidance.riskAreas.length > 0) {
        lines.push('  Risk Areas:');
        for (const risk of suggestion.testingGuidance.riskAreas) {
          lines.push(`    • ${risk}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Extract common patterns from multiple fix suggestions
   *
   * @param suggestions - Array of fix suggestions to analyze
   * @returns Analysis of common patterns and recommendations
   *
   * @example
   * ```typescript
   * const patterns = FixSuggestionUtils.analyzeSuggestionPatterns(suggestions);
   * console.log('Common changes:', patterns.commonChanges);
   * console.log('Best practices:', patterns.suggestedBestPractices);
   * ```
   */
  static analyzeSuggestionPatterns(suggestions: AiFixSuggestionV2[]): {
    commonChanges: string[];
    suggestedBestPractices: string[];
    languageSpecificTips: Record<string, string[]>;
  } {
    const commonChanges = new Set<string>();
    const bestPractices = new Set<string>();
    const languageTips: Record<string, Set<string>> = {};

    for (const suggestion of suggestions) {
      // Analyze common change patterns
      for (const change of suggestion.changes) {
        const language = change.fileMetadata?.language;
        if (language && !languageTips[language]) {
          languageTips[language] = new Set();
        }

        for (const lineChange of change.lineChanges) {
          // Extract common patterns from changes
          if (lineChange.changeReason) {
            commonChanges.add(lineChange.changeReason);
          }

          if (language && lineChange.changeReason) {
            const tips = languageTips[language];
            if (tips) {
              tips.add(lineChange.changeReason);
            }
          }
        }
      }

      // Extract best practices from references
      if (suggestion.references) {
        for (const ref of suggestion.references) {
          if (ref.type === 'best_practice') {
            bestPractices.add(ref.title);
          }
        }
      }

      // Extract patterns from explanations
      const explanation = suggestion.explanation.toLowerCase();
      if (explanation.includes('performance')) {
        commonChanges.add('Performance improvement');
      }
      if (explanation.includes('security')) {
        commonChanges.add('Security enhancement');
      }
      if (explanation.includes('maintainability')) {
        commonChanges.add('Maintainability improvement');
      }
    }

    return {
      commonChanges: Array.from(commonChanges),
      suggestedBestPractices: Array.from(bestPractices),
      languageSpecificTips: Object.fromEntries(
        Object.entries(languageTips).map(([lang, tips]) => [lang, Array.from(tips)]),
      ),
    };
  }

  /**
   * Generate statistics from fix suggestions
   *
   * @param suggestions - Array of fix suggestions to analyze
   * @returns Statistical analysis of the suggestions
   *
   * @example
   * ```typescript
   * const stats = FixSuggestionUtils.generateSuggestionStats(suggestions);
   * console.log(`Average confidence: ${stats.successRates.average}%`);
   * console.log(`High confidence fixes: ${stats.byConfidence.high}`);
   * ```
   */
  static generateSuggestionStats(suggestions: AiFixSuggestionV2[]): FixSuggestionStats {
    const confidenceBuckets = { high: 0, medium: 0, low: 0 };
    const complexityBuckets = { low: 0, medium: 0, high: 0 };
    const successRates: number[] = [];
    const patternCounts = new Map<string, number>();

    this.processSuggestions(
      suggestions,
      confidenceBuckets,
      complexityBuckets,
      successRates,
      patternCounts,
    );

    const successRateStats = this.calculateSuccessRateStats(successRates);
    const commonPatterns = this.calculateCommonPatterns(suggestions, patternCounts);

    return {
      totalSuggestions: suggestions.length,
      byConfidence: confidenceBuckets,
      byComplexity: complexityBuckets,
      successRates: successRateStats,
      commonPatterns,
    };
  }

  private static processSuggestions(
    suggestions: AiFixSuggestionV2[],
    confidenceBuckets: { high: number; medium: number; low: number },
    complexityBuckets: { low: number; medium: number; high: number },
    successRates: number[],
    patternCounts: Map<string, number>,
  ): void {
    for (const suggestion of suggestions) {
      this.categorizeByConfidence(suggestion, confidenceBuckets);
      complexityBuckets[suggestion.complexity]++;
      successRates.push(suggestion.successRate);
      this.countPatterns(suggestion, patternCounts);
    }
  }

  private static categorizeByConfidence(
    suggestion: AiFixSuggestionV2,
    confidenceBuckets: { high: number; medium: number; low: number },
  ): void {
    if (suggestion.confidence >= 80) {
      confidenceBuckets.high++;
    } else if (suggestion.confidence >= 50) {
      confidenceBuckets.medium++;
    } else {
      confidenceBuckets.low++;
    }
  }

  private static countPatterns(
    suggestion: AiFixSuggestionV2,
    patternCounts: Map<string, number>,
  ): void {
    for (const change of suggestion.changes) {
      for (const lineChange of change.lineChanges) {
        if (lineChange.changeReason) {
          const current = patternCounts.get(lineChange.changeReason) ?? 0;
          patternCounts.set(lineChange.changeReason, current + 1);
        }
      }
    }
  }

  private static calculateSuccessRateStats(successRates: number[]): {
    average: number;
    median: number;
    standardDeviation: number;
  } {
    if (successRates.length === 0) {
      return { average: 0, median: 0, standardDeviation: 0 };
    }

    const average = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const median = this.calculateMedian(successRates);
    const variance =
      successRates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) /
      successRates.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
    };
  }

  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const { length } = sorted;

    if (length % 2 === 1) {
      return sorted[Math.floor(length / 2)] ?? 0;
    }

    const midIndex = Math.floor(length / 2);
    const a = sorted[midIndex - 1] ?? 0;
    const b = sorted[midIndex] ?? 0;
    return (a + b) / 2;
  }

  private static calculateCommonPatterns(
    suggestions: AiFixSuggestionV2[],
    patternCounts: Map<string, number>,
  ): Array<{ pattern: string; frequency: number; averageConfidence: number }> {
    return Array.from(patternCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pattern, frequency]) => ({
        pattern,
        frequency,
        averageConfidence: this.calculatePatternAverageConfidence(suggestions, pattern),
      }));
  }

  private static calculatePatternAverageConfidence(
    suggestions: AiFixSuggestionV2[],
    pattern: string,
  ): number {
    const matchingSuggestions = this.filterSuggestionsByPattern(suggestions, pattern);

    if (matchingSuggestions.length === 0) {
      return 0;
    }

    const totalConfidence = matchingSuggestions.reduce((sum, s) => sum + s.confidence, 0);
    return totalConfidence / matchingSuggestions.length;
  }

  private static filterSuggestionsByPattern(
    suggestions: AiFixSuggestionV2[],
    pattern: string,
  ): AiFixSuggestionV2[] {
    return suggestions.filter((suggestion) =>
      suggestion.changes.some((change) =>
        change.lineChanges.some((lineChange) => lineChange.changeReason === pattern),
      ),
    );
  }

  // ===== Private Helper Methods =====

  /**
   * Check if a file appears to be accessible (simplified heuristic)
   * @private
   */
  private static isFileAccessible(filePath: string): boolean {
    // Implementation would check file system permissions
    // This is a placeholder for the actual implementation
    return filePath.length > 0 && !filePath.includes('..') && !filePath.startsWith('/');
  }

  /**
   * Calculate overall risk level
   * @private
   */
  private static calculateRiskLevel(
    confidence: number,
    complexity: 'low' | 'medium' | 'high',
    linesChanged: number,
  ): 'low' | 'medium' | 'high' {
    const complexityScore = { low: 1, medium: 2, high: 3 }[complexity];
    const confidenceScore = confidence / 100;
    const sizeScore = Math.min(linesChanged / 10, 3); // Cap at 3

    const riskScore = (complexityScore + sizeScore) * (1 - confidenceScore);

    if (riskScore > 2) {
      return 'high';
    }
    if (riskScore > 1) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Estimate time to apply fix
   * @private
   */
  private static estimateApplicationTime(
    effort: 'trivial' | 'easy' | 'moderate' | 'complex',
    linesChanged: number,
  ): string {
    const baseTime = {
      trivial: 1,
      easy: 5,
      moderate: 15,
      complex: 30,
    }[effort];

    const timeWithSize = baseTime + Math.floor(linesChanged / 5);

    if (timeWithSize < 5) {
      return '< 5 minutes';
    }
    if (timeWithSize < 15) {
      return '5-15 minutes';
    }
    if (timeWithSize < 30) {
      return '15-30 minutes';
    }
    if (timeWithSize < 60) {
      return '30-60 minutes';
    }
    return '> 1 hour';
  }

  /**
   * Calculate weighted score for suggestion ranking
   * @private
   */
  private static calculateSuggestionScore(
    suggestion: AiFixSuggestionV2,
    weights: {
      confidenceWeight: number;
      successRateWeight: number;
      complexityWeight: number;
      effortWeight: number;
    },
  ): number {
    const confidenceScore = suggestion.confidence / 100;
    const successRateScore = suggestion.successRate / 100;

    // Complexity: lower is better (invert scale)
    const complexityScore = { high: 0.2, medium: 0.6, low: 1.0 }[suggestion.complexity];

    // Effort: lower is better (invert scale)
    const effortScore = { complex: 0.2, moderate: 0.4, easy: 0.7, trivial: 1.0 }[
      suggestion.effortEstimate
    ];

    return (
      confidenceScore * weights.confidenceWeight +
      successRateScore * weights.successRateWeight +
      complexityScore * weights.complexityWeight +
      effortScore * weights.effortWeight
    );
  }
}

/**
 * Integration helpers for working with the Issues API
 */

export class FixSuggestionIntegration {
  /**
   * Find issues that are eligible for AI fix suggestions
   *
   * @param client - SonarQube client instance
   * @param projectKey - Project to search in
   * @param options - Integration options
   * @returns Array of eligible issues with availability info
   *
   * @example
   * ```typescript
   * const eligibleIssues = await FixSuggestionIntegration.findEligibleIssues(
   *   client,
   *   'my-project',
   *   {
   *     severity: ['MAJOR', 'CRITICAL'],
   *     autoCheckAvailability: true
   *   }
   * );
   *
   * console.log(`Found ${eligibleIssues.length} issues eligible for AI fixes`);
   * ```
   */
  static async findEligibleIssues(
    client: SonarQubeClient,
    projectKey: string,
    options: IssueIntegrationOptions = {},
  ): Promise<Array<{ issue: any; availability: FixSuggestionAvailabilityV2Response }>> {
    const { autoCheckAvailability = true, eligibilityCriteria = {} } = options;

    // Get issues from the Issues API
    const issuesResponse = await client.issues
      .search()
      .withProjects([projectKey])
      .withSeverities((eligibilityCriteria.severity ?? ['MAJOR', 'CRITICAL', 'BLOCKER']) as any[])
      .withTypes((eligibilityCriteria.types ?? ['BUG', 'CODE_SMELL']) as any[])
      .execute();

    let eligibleIssues = issuesResponse.issues;

    // Filter by age if specified
    if (eligibilityCriteria.age) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - eligibilityCriteria.age);

      eligibleIssues = eligibleIssues.filter((issue: any) => {
        const creationDate = new Date(issue.creationDate);
        return creationDate >= cutoffDate;
      });
    }

    // Filter by location if specified
    if (eligibilityCriteria.hasLocation) {
      eligibleIssues = eligibleIssues.filter((issue: any) => issue.textRange || issue.line);
    }

    const results = [];

    if (autoCheckAvailability) {
      // Check each issue for AI suggestion availability
      for (const issue of eligibleIssues) {
        try {
          const availability = await client.fixSuggestions.getIssueAvailabilityV2({
            issueKey: issue.key,
            projectKey,
          });

          if (availability.available) {
            results.push({ issue, availability });
          }
        } catch (error) {
          // Log but don't fail for individual issues
          console.warn(`Failed to check availability for issue ${issue.key}:`, error);
        }
      }
    } else {
      // Return all eligible issues without checking availability
      results.push(
        ...eligibleIssues.map((issue: any) => ({
          issue,
          availability: { available: true } as FixSuggestionAvailabilityV2Response,
        })),
      );
    }

    return results;
  }

  /**
   * Process multiple issues for fix suggestions in batch
   *
   * @param client - SonarQube client instance
   * @param issueKeys - Array of issue keys to process
   * @param options - Batch processing options
   * @returns Batch processing results
   *
   * @example
   * ```typescript
   * const results = await FixSuggestionIntegration.batchProcessIssues(
   *   client,
   *   ['issue1', 'issue2', 'issue3'],
   *   {
   *     concurrency: 3,
   *     onProgress: (progress) => {
   *       console.log(`Progress: ${progress.completed}/${progress.total}`);
   *     }
   *   }
   * );
   *
   * console.log(`Successfully processed: ${results.successful.length}`);
   * console.log(`Failed: ${results.failed.length}`);
   * ```
   */
  static async batchProcessIssues(
    client: SonarQubeClient,
    issueKeys: string[],
    options: BatchProcessingOptions = {},
  ): Promise<BatchFixResult> {
    const { concurrency = 3, requestDelay = 100, continueOnError = true, onProgress } = options;

    const successful: BatchFixResult['successful'] = [];
    const failed: BatchFixResult['failed'] = [];
    const startTime = Date.now();

    // Process issues in batches
    for (let i = 0; i < issueKeys.length; i += concurrency) {
      const batch = issueKeys.slice(i, i + concurrency);

      const batchPromises = batch.map(async (issueKey) => {
        try {
          const processingStart = Date.now();
          const suggestions = await client.fixSuggestions.requestAiSuggestionsV2({
            issueKey,
            maxAlternatives: 3,
          });

          successful.push({
            issueKey,
            suggestions: suggestions.suggestions,
            processingTime: Date.now() - processingStart,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failed.push({
            issueKey,
            error: errorMessage,
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
            retryable: !errorMessage.includes('unsupported') && !errorMessage.includes('quota'),
          });

          if (!continueOnError) {
            throw error;
          }
        }

        // Delay between requests to avoid rate limiting
        if (requestDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, requestDelay));
        }
      });

      await Promise.all(batchPromises);

      // Report progress
      if (onProgress && batch.length > 0) {
        const currentIssue = batch[batch.length - 1];
        onProgress({
          completed: successful.length + failed.length,
          total: issueKeys.length,
          ...(currentIssue && { current: currentIssue }),
          errors: failed.length,
        });
      }
    }

    // Calculate summary statistics
    const totalProcessingTime = Date.now() - startTime;
    const totalConfidence = successful.reduce((sum, result) => {
      const avgConfidence =
        result.suggestions.reduce((s, suggestion) => s + suggestion.confidence, 0) /
        result.suggestions.length;
      return sum + avgConfidence;
    }, 0);
    const averageConfidence = successful.length > 0 ? totalConfidence / successful.length : 0;

    return {
      successful,
      failed,
      summary: {
        totalProcessed: issueKeys.length,
        successCount: successful.length,
        failureCount: failed.length,
        totalProcessingTime,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
      },
    };
  }
}
