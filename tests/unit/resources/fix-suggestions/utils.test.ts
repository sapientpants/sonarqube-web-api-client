// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';

import {
  FixSuggestionUtils,
  FixSuggestionIntegration,
} from '../../../../src/resources/fix-suggestions/utils.js';
import type {
  AiFixSuggestionV2,
  AiCodeChangeV2,
  FixApplicationOptions,
} from '../../../../src/resources/fix-suggestions/types.js';

describe('FixSuggestionUtils', () => {
  const mockSuggestion: AiFixSuggestionV2 = {
    id: 'fix-1',
    explanation: 'Use StringBuilder instead of string concatenation',
    confidence: 85,
    complexity: 'low',
    successRate: 90,
    effortEstimate: 'easy',
    changes: [
      {
        filePath: 'src/main/java/App.java',
        originalHash: 'abc123',
        lineChanges: [
          {
            startLine: 10,
            endLine: 10,
            originalContent: 'String result = str1 + str2;',
            newContent: 'String result = new StringBuilder().append(str1).append(str2).toString();',
            changeType: 'replace',
            changeReason: 'Improve performance',
            changeConfidence: 95,
          },
        ],
        fileMetadata: {
          language: 'java',
          encoding: 'UTF-8',
          totalLines: 100,
        },
      },
    ],
    notes: ['This change improves performance for large strings'],
    references: [
      {
        title: 'Java StringBuilder Best Practices',
        url: 'https://docs.oracle.com/java',
        type: 'best_practice',
      },
    ],
    testingGuidance: {
      suggestedTests: ['Test with empty strings', 'Test with null values'],
      riskAreas: ['String concatenation logic'],
      verificationSteps: ['Verify output matches', 'Check performance'],
    },
  };

  describe('validateFixApplication', () => {
    it('should validate a valid fix suggestion', () => {
      const result = FixSuggestionUtils.validateFixApplication(mockSuggestion);

      expect(result.canApply).toBe(true);
      expect(result.blockers).toHaveLength(0);
      expect(result.impact).toBeDefined();
      expect(result.impact?.filesAffected).toBe(1);
      expect(result.impact?.linesChanged).toBe(1);
    });

    it('should detect invalid line ranges', () => {
      const invalidSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        changes: [
          {
            ...mockSuggestion.changes[0],
            lineChanges: [
              {
                startLine: 15,
                endLine: 10, // Invalid: end before start
                originalContent: 'test',
                newContent: 'test',
                changeType: 'replace',
              },
            ],
          },
        ],
      };

      const result = FixSuggestionUtils.validateFixApplication(invalidSuggestion);

      expect(result.canApply).toBe(false);
      expect(result.blockers).toHaveLength(1);
      expect(result.blockers[0].type).toBe('syntax_error');
      expect(result.blockers[0].message).toContain('Invalid line range');
    });

    it('should detect invalid start line numbers', () => {
      const invalidSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        changes: [
          {
            ...mockSuggestion.changes[0],
            lineChanges: [
              {
                startLine: 0, // Invalid: lines are 1-indexed
                endLine: 5,
                originalContent: 'test',
                newContent: 'test',
                changeType: 'replace',
              },
            ],
          },
        ],
      };

      const result = FixSuggestionUtils.validateFixApplication(invalidSuggestion);

      expect(result.canApply).toBe(false);
      expect(result.blockers).toHaveLength(1);
      expect(result.blockers[0].type).toBe('syntax_error');
      expect(result.blockers[0].message).toContain('Invalid start line');
    });

    it('should detect dangerous code in strict mode', () => {
      const dangerousSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        changes: [
          {
            ...mockSuggestion.changes[0],
            lineChanges: [
              {
                startLine: 10,
                endLine: 10,
                originalContent: 'String code = input;',
                newContent: 'eval(input);', // Dangerous
                changeType: 'replace',
              },
            ],
          },
        ],
      };

      const result = FixSuggestionUtils.validateFixApplication(dangerousSuggestion, {
        validationMode: 'strict',
      });

      expect(result.canApply).toBe(false);
      expect(result.blockers).toHaveLength(1);
      expect(result.blockers[0].type).toBe('validation_failed');
      expect(result.blockers[0].message).toContain('dangerous functions');
    });

    it('should apply custom validation', () => {
      const customValidation = vi.fn().mockReturnValue(false);

      const result = FixSuggestionUtils.validateFixApplication(mockSuggestion, {
        customValidation,
      });

      expect(result.canApply).toBe(false);
      expect(result.blockers).toHaveLength(1);
      expect(result.blockers[0].type).toBe('validation_failed');
      expect(customValidation).toHaveBeenCalledWith(mockSuggestion.changes[0]);
    });

    it('should add warnings for low confidence changes', () => {
      const lowConfidenceSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        changes: [
          {
            ...mockSuggestion.changes[0],
            lineChanges: [
              {
                ...mockSuggestion.changes[0].lineChanges[0],
                changeConfidence: 70, // Low confidence
              },
            ],
          },
        ],
      };

      const result = FixSuggestionUtils.validateFixApplication(lowConfidenceSuggestion);

      expect(result.canApply).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Low confidence change');
    });

    it('should calculate risk level correctly', () => {
      const highRiskSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        confidence: 30, // Low confidence
        complexity: 'high', // High complexity
        changes: Array(20).fill(mockSuggestion.changes[0]), // Many changes
      };

      const result = FixSuggestionUtils.validateFixApplication(highRiskSuggestion);

      expect(result.impact?.riskLevel).toBe('high');
    });
  });

  describe('rankSuggestions', () => {
    const suggestions: AiFixSuggestionV2[] = [
      {
        ...mockSuggestion,
        id: 'fix-1',
        confidence: 70,
        successRate: 80,
        complexity: 'high',
        effortEstimate: 'complex',
      },
      {
        ...mockSuggestion,
        id: 'fix-2',
        confidence: 90,
        successRate: 85,
        complexity: 'low',
        effortEstimate: 'trivial',
      },
      {
        ...mockSuggestion,
        id: 'fix-3',
        confidence: 80,
        successRate: 90,
        complexity: 'medium',
        effortEstimate: 'easy',
      },
    ];

    it('should rank suggestions by default criteria', () => {
      const ranked = FixSuggestionUtils.rankSuggestions(suggestions);

      expect(ranked[0].id).toBe('fix-2'); // Best overall
      expect(ranked[1].id).toBe('fix-3'); // Medium
      expect(ranked[2].id).toBe('fix-1'); // Worst overall
    });

    it('should use custom weighting criteria', () => {
      const ranked = FixSuggestionUtils.rankSuggestions(suggestions, {
        confidenceWeight: 1.0,
        successRateWeight: 0.0,
        complexityWeight: 0.0,
        effortWeight: 0.0,
      });

      // Should rank purely by confidence
      expect(ranked[0].confidence).toBe(90);
      expect(ranked[1].confidence).toBe(80);
      expect(ranked[2].confidence).toBe(70);
    });

    it('should not mutate original array', () => {
      const originalOrder = suggestions.map((s) => s.id);
      FixSuggestionUtils.rankSuggestions(suggestions);

      expect(suggestions.map((s) => s.id)).toEqual(originalOrder);
    });
  });

  describe('generateChangePreview', () => {
    it('should generate a comprehensive preview', () => {
      const preview = FixSuggestionUtils.generateChangePreview(mockSuggestion);

      expect(preview).toContain(mockSuggestion.explanation);
      expect(preview).toContain(`Confidence: ${mockSuggestion.confidence}%`);
      expect(preview).toContain(`Complexity: ${mockSuggestion.complexity}`);
      expect(preview).toContain(`Effort: ${mockSuggestion.effortEstimate}`);
      expect(preview).toContain(mockSuggestion.changes[0].filePath);
      expect(preview).toContain('Line 10:');
      expect(preview).toContain('- String result = str1 + str2;');
      expect(preview).toContain('+ String result = new StringBuilder()');
      expect(preview).toContain('(Improve performance)');
    });

    it('should include notes when present', () => {
      const preview = FixSuggestionUtils.generateChangePreview(mockSuggestion);

      expect(preview).toContain('Notes:');
      expect(preview).toContain('This change improves performance');
    });

    it('should include testing guidance', () => {
      const preview = FixSuggestionUtils.generateChangePreview(mockSuggestion);

      expect(preview).toContain('Testing Guidance:');
      expect(preview).toContain('Suggested Tests:');
      expect(preview).toContain('Test with empty strings');
      expect(preview).toContain('Risk Areas:');
      expect(preview).toContain('String concatenation logic');
    });

    it('should handle line ranges', () => {
      const multiLineSuggestion: AiFixSuggestionV2 = {
        ...mockSuggestion,
        changes: [
          {
            ...mockSuggestion.changes[0],
            lineChanges: [
              {
                startLine: 10,
                endLine: 12, // Multi-line change
                originalContent: 'old code',
                newContent: 'new code',
                changeType: 'replace',
              },
            ],
          },
        ],
      };

      const preview = FixSuggestionUtils.generateChangePreview(multiLineSuggestion);

      expect(preview).toContain('Lines 10-12:');
    });
  });

  describe('analyzeSuggestionPatterns', () => {
    const suggestions: AiFixSuggestionV2[] = [
      {
        ...mockSuggestion,
        explanation: 'Performance improvement using StringBuilder',
        changes: [
          {
            ...mockSuggestion.changes[0],
            fileMetadata: { language: 'java', encoding: 'UTF-8', totalLines: 100 },
            lineChanges: [
              {
                ...mockSuggestion.changes[0].lineChanges[0],
                changeReason: 'Performance optimization',
              },
            ],
          },
        ],
        references: [
          {
            title: 'Java Performance Guide',
            url: 'https://example.com',
            type: 'best_practice',
          },
        ],
      },
      {
        ...mockSuggestion,
        id: 'fix-2',
        explanation: 'Security improvement using prepared statements',
        changes: [
          {
            ...mockSuggestion.changes[0],
            filePath: 'src/dao/UserDao.java',
            fileMetadata: { language: 'java', encoding: 'UTF-8', totalLines: 150 },
            lineChanges: [
              {
                ...mockSuggestion.changes[0].lineChanges[0],
                changeReason: 'Security enhancement',
              },
            ],
          },
        ],
      },
    ];

    it('should analyze common patterns', () => {
      const analysis = FixSuggestionUtils.analyzeSuggestionPatterns(suggestions);

      expect(analysis.commonChanges).toContain('Performance optimization');
      expect(analysis.commonChanges).toContain('Security enhancement');
      expect(analysis.commonChanges).toContain('Performance improvement');
      expect(analysis.suggestedBestPractices).toContain('Java Performance Guide');
    });

    it('should group language-specific tips', () => {
      const analysis = FixSuggestionUtils.analyzeSuggestionPatterns(suggestions);

      expect(analysis.languageSpecificTips.java).toContain('Performance optimization');
      expect(analysis.languageSpecificTips.java).toContain('Security enhancement');
    });

    it('should handle empty suggestions', () => {
      const analysis = FixSuggestionUtils.analyzeSuggestionPatterns([]);

      expect(analysis.commonChanges).toHaveLength(0);
      expect(analysis.suggestedBestPractices).toHaveLength(0);
      expect(Object.keys(analysis.languageSpecificTips)).toHaveLength(0);
    });
  });

  describe('generateSuggestionStats', () => {
    const suggestions: AiFixSuggestionV2[] = [
      { ...mockSuggestion, confidence: 90, successRate: 85, complexity: 'low' },
      { ...mockSuggestion, confidence: 70, successRate: 75, complexity: 'medium' },
      { ...mockSuggestion, confidence: 40, successRate: 65, complexity: 'high' },
      { ...mockSuggestion, confidence: 95, successRate: 90, complexity: 'low' },
    ];

    it('should generate comprehensive statistics', () => {
      const stats = FixSuggestionUtils.generateSuggestionStats(suggestions);

      expect(stats.totalSuggestions).toBe(4);
      expect(stats.byConfidence.high).toBe(2); // 90%, 95%
      expect(stats.byConfidence.medium).toBe(1); // 70%
      expect(stats.byConfidence.low).toBe(1); // 40%
      expect(stats.byComplexity.low).toBe(2);
      expect(stats.byComplexity.medium).toBe(1);
      expect(stats.byComplexity.high).toBe(1);
    });

    it('should calculate success rate statistics', () => {
      const stats = FixSuggestionUtils.generateSuggestionStats(suggestions);

      expect(stats.successRates.average).toBe(78.75); // (85+75+65+90)/4
      expect(stats.successRates.median).toBe(80); // Middle of sorted [65,75,85,90] = (75+85)/2
      expect(stats.successRates.standardDeviation).toBeCloseTo(9.6, 1);
    });

    it('should handle empty suggestions', () => {
      const stats = FixSuggestionUtils.generateSuggestionStats([]);

      expect(stats.totalSuggestions).toBe(0);
      expect(stats.successRates.average).toBe(0);
      expect(stats.successRates.median).toBe(0);
      expect(stats.commonPatterns).toHaveLength(0);
    });
  });
});

describe('FixSuggestionIntegration', () => {
  describe('findEligibleIssues', () => {
    const mockExecute = vi.fn();
    const mockClient = {
      issues: {
        search: () => ({
          withProjects: () => ({
            withSeverities: () => ({
              withTypes: () => ({
                execute: mockExecute,
              }),
            }),
          }),
        }),
      },
      fixSuggestions: {
        getIssueAvailabilityV2: vi.fn(),
      },
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should find eligible issues with availability check', async () => {
      const mockIssues = [
        { key: 'issue1', creationDate: '2025-01-30T10:00:00Z', line: 10 },
        { key: 'issue2', creationDate: '2025-01-30T11:00:00Z', textRange: { startLine: 5 } },
      ];

      mockExecute.mockResolvedValue({ issues: mockIssues });

      mockClient.fixSuggestions.getIssueAvailabilityV2
        .mockResolvedValueOnce({ available: true })
        .mockResolvedValueOnce({ available: false });

      const result = await FixSuggestionIntegration.findEligibleIssues(mockClient, 'my-project', {
        autoCheckAvailability: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].issue.key).toBe('issue1');
      expect(result[0].availability.available).toBe(true);
    });

    it('should filter by age when specified', async () => {
      const oldIssue = {
        key: 'old-issue',
        creationDate: '2024-01-01T10:00:00Z',
        line: 10,
      };
      const newIssue = {
        key: 'new-issue',
        creationDate: new Date().toISOString(),
        line: 10,
      };

      mockExecute.mockResolvedValue({ issues: [oldIssue, newIssue] });

      mockClient.fixSuggestions.getIssueAvailabilityV2.mockResolvedValue({ available: true });

      const result = await FixSuggestionIntegration.findEligibleIssues(mockClient, 'my-project', {
        autoCheckAvailability: true,
        eligibilityCriteria: { age: 30 }, // Only issues from last 30 days
      });

      expect(result).toHaveLength(1);
      expect(result[0].issue.key).toBe('new-issue');
    });

    it('should filter by location when specified', async () => {
      const issueWithLocation = {
        key: 'located-issue',
        creationDate: '2025-01-30T10:00:00Z',
        line: 10,
      };
      const issueWithoutLocation = {
        key: 'unlocated-issue',
        creationDate: '2025-01-30T10:00:00Z',
      };

      mockExecute.mockResolvedValue({ issues: [issueWithLocation, issueWithoutLocation] });

      mockClient.fixSuggestions.getIssueAvailabilityV2.mockResolvedValue({ available: true });

      const result = await FixSuggestionIntegration.findEligibleIssues(mockClient, 'my-project', {
        autoCheckAvailability: true,
        eligibilityCriteria: { hasLocation: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].issue.key).toBe('located-issue');
    });

    it('should handle availability check errors gracefully', async () => {
      const mockIssues = [
        { key: 'issue1', creationDate: '2025-01-30T10:00:00Z', line: 10 },
        { key: 'issue2', creationDate: '2025-01-30T11:00:00Z', line: 20 },
      ];

      mockExecute.mockResolvedValue({ issues: mockIssues });

      mockClient.fixSuggestions.getIssueAvailabilityV2
        .mockResolvedValueOnce({ available: true })
        .mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      const result = await FixSuggestionIntegration.findEligibleIssues(mockClient, 'my-project');

      expect(result).toHaveLength(1);
      expect(result[0].issue.key).toBe('issue1');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check availability for issue issue2:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('batchProcessIssues', () => {
    const mockClient = {
      fixSuggestions: {
        requestAiSuggestionsV2: vi.fn(),
      },
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should process issues in batches with progress updates', async () => {
      const issueKeys = ['issue1', 'issue2', 'issue3'];
      const mockResponse = {
        sessionId: 'test',
        suggestions: [{ id: 'fix1', confidence: 85 }],
        metadata: {},
      };

      mockClient.fixSuggestions.requestAiSuggestionsV2.mockResolvedValue(mockResponse);

      const progressUpdates: any[] = [];
      const onProgress = vi.fn((progress) => {
        progressUpdates.push(progress);
      });

      const result = await FixSuggestionIntegration.batchProcessIssues(mockClient, issueKeys, {
        concurrency: 2,
        onProgress,
      });

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.totalProcessed).toBe(3);
      expect(result.summary.successCount).toBe(3);
      expect(result.summary.failureCount).toBe(0);
      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle failures with continue on error', async () => {
      const issueKeys = ['issue1', 'issue2', 'issue3'];
      const mockResponse = {
        sessionId: 'test',
        suggestions: [{ id: 'fix1', confidence: 85 }],
        metadata: {},
      };

      mockClient.fixSuggestions.requestAiSuggestionsV2
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await FixSuggestionIntegration.batchProcessIssues(mockClient, issueKeys, {
        continueOnError: true,
      });

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].issueKey).toBe('issue2');
      expect(result.failed[0].error).toBe('API Error');
      expect(result.failed[0].retryable).toBe(true);
    });

    it('should stop on first error when continueOnError is false', async () => {
      const issueKeys = ['issue1', 'issue2', 'issue3'];

      mockClient.fixSuggestions.requestAiSuggestionsV2.mockRejectedValue(new Error('Fatal Error'));

      await expect(
        FixSuggestionIntegration.batchProcessIssues(mockClient, issueKeys, {
          continueOnError: false,
        }),
      ).rejects.toThrow('Fatal Error');
    });

    it('should calculate average confidence correctly', async () => {
      const issueKeys = ['issue1', 'issue2'];

      mockClient.fixSuggestions.requestAiSuggestionsV2
        .mockResolvedValueOnce({
          sessionId: 'test1',
          suggestions: [
            { id: 'fix1', confidence: 80 },
            { id: 'fix2', confidence: 90 },
          ],
          metadata: {},
        })
        .mockResolvedValueOnce({
          sessionId: 'test2',
          suggestions: [{ id: 'fix3', confidence: 70 }],
          metadata: {},
        });

      const result = await FixSuggestionIntegration.batchProcessIssues(mockClient, issueKeys);

      // Average confidence: ((80+90)/2 + 70)/2 = (85 + 70)/2 = 77.5
      expect(result.summary.averageConfidence).toBe(77.5);
    });
  });
});
