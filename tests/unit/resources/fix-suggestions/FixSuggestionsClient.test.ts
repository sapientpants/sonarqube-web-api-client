// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import { SonarQubeClient } from '../../../../src/index.js';
import type {
  FixSuggestionAvailabilityV2Response,
  AiSuggestionResponseV2,
} from '../../../../src/resources/fix-suggestions/types.js';

describe('FixSuggestionsClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: SonarQubeClient;

  beforeEach(() => {
    client = new SonarQubeClient(baseUrl, token);
  });

  describe('getIssueAvailabilityV2', () => {
    it('should check availability for valid issue', async () => {
      const mockResponse: FixSuggestionAvailabilityV2Response = {
        available: true,
        estimatedProcessingTime: 5,
        aiModel: {
          name: 'sonar-ai-fix-model',
          version: '2.1.0',
          capabilities: ['java', 'javascript', 'typescript'],
          supportedLanguages: ['java', 'js', 'ts', 'py', 'cs'],
        },
        rateLimiting: {
          requestsRemaining: 45,
          resetTime: '2025-01-30T11:00:00Z',
          dailyQuota: 100,
        },
      };

      server.use(
        http.get('*/api/v2/fix-suggestions/issues', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.fixSuggestions.getIssueAvailabilityV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
      });

      expect(result).toEqual(mockResponse);
      expect(result.available).toBe(true);
      expect(result.aiModel?.name).toBe('sonar-ai-fix-model');
    });

    it('should handle unavailable AI service', async () => {
      const mockResponse: FixSuggestionAvailabilityV2Response = {
        available: false,
        reason: 'ai_service_unavailable',
      };

      server.use(
        http.get('*/api/v2/fix-suggestions/issues', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.fixSuggestions.getIssueAvailabilityV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('ai_service_unavailable');
    });

    it('should include project context in request', async () => {
      const mockResponse: FixSuggestionAvailabilityV2Response = {
        available: true,
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/fix-suggestions/issues', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.fixSuggestions.getIssueAvailabilityV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
        branch: 'main',
      });

      expect(capturedUrl).toContain('issueKey=AY8qEqN7UVrTsQCOExjT');
      expect(capturedUrl).toContain('projectKey=my-project');
      expect(capturedUrl).toContain('branch=main');
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/api/v2/fix-suggestions/issues', () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      await expect(
        client.fixSuggestions.getIssueAvailabilityV2({
          issueKey: 'AY8qEqN7UVrTsQCOExjT',
        }),
      ).rejects.toThrow();
    });
  });

  describe('requestAiSuggestionsV2', () => {
    it('should generate fix suggestions', async () => {
      const mockResponse: AiSuggestionResponseV2 = {
        sessionId: 'fix-session-123',
        issue: {
          key: 'AY8qEqN7UVrTsQCOExjT',
          rule: 'java:S1234',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          message: 'Use StringBuilder instead of string concatenation',
          component: 'com.example:my-project:src/main/java/App.java',
          line: 42,
          textRange: {
            startLine: 42,
            endLine: 42,
            startOffset: 12,
            endOffset: 35,
          },
        },
        suggestions: [
          {
            id: 'fix-suggestion-1',
            explanation: 'Replace string concatenation with StringBuilder for better performance',
            confidence: 95,
            complexity: 'low',
            successRate: 92,
            effortEstimate: 'trivial',
            changes: [
              {
                filePath: 'src/main/java/App.java',
                originalHash: 'abc123',
                lineChanges: [
                  {
                    startLine: 42,
                    endLine: 42,
                    originalContent: 'String result = str1 + str2 + str3;',
                    newContent:
                      'String result = new StringBuilder().append(str1).append(str2).append(str3).toString();',
                    changeType: 'replace',
                    changeReason: 'Improve performance by using StringBuilder',
                    changeConfidence: 95,
                  },
                ],
                fileMetadata: {
                  language: 'java',
                  encoding: 'UTF-8',
                  totalLines: 150,
                },
              },
            ],
            references: [
              {
                title: 'Java StringBuilder Best Practices',
                url: 'https://docs.oracle.com/javase/tutorial/java/data/buffers.html',
                type: 'documentation',
              },
            ],
            testingGuidance: {
              suggestedTests: ['Test with empty strings', 'Test with null values'],
              riskAreas: ['String concatenation logic'],
              verificationSteps: [
                'Verify output matches original',
                'Check performance improvement',
              ],
            },
          },
        ],
        metadata: {
          processingTime: 2500,
          modelUsed: 'sonar-ai-fix-model-v2.1',
          confidenceThreshold: 80,
          contextAnalyzed: true,
          requestTimestamp: '2025-01-30T10:00:00Z',
          responseTimestamp: '2025-01-30T10:00:02Z',
        },
      };

      server.use(
        http.post('*/api/v2/fix-suggestions/ai-suggestions', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.fixSuggestions.requestAiSuggestionsV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        includeContext: true,
        maxAlternatives: 3,
        fixStyle: 'comprehensive',
      });

      expect(result).toEqual(mockResponse);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].confidence).toBe(95);
      expect(result.suggestions[0].changes).toHaveLength(1);
    });

    it('should handle multiple alternatives', async () => {
      const mockResponse: AiSuggestionResponseV2 = {
        sessionId: 'fix-session-456',
        issue: {
          key: 'AY8qEqN7UVrTsQCOExjT',
          rule: 'java:S1234',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          message: 'Use StringBuilder instead of string concatenation',
          component: 'com.example:my-project:src/main/java/App.java',
        },
        suggestions: [
          {
            id: 'fix-suggestion-1',
            explanation: 'Primary solution: Use StringBuilder',
            confidence: 95,
            complexity: 'low',
            successRate: 92,
            effortEstimate: 'trivial',
            changes: [],
          },
          {
            id: 'fix-suggestion-2',
            explanation: 'Alternative: Use String.join()',
            confidence: 85,
            complexity: 'low',
            successRate: 88,
            effortEstimate: 'easy',
            changes: [],
          },
          {
            id: 'fix-suggestion-3',
            explanation: 'Alternative: Use MessageFormat',
            confidence: 70,
            complexity: 'medium',
            successRate: 75,
            effortEstimate: 'moderate',
            changes: [],
          },
        ],
        metadata: {
          processingTime: 3200,
          modelUsed: 'sonar-ai-fix-model-v2.1',
          confidenceThreshold: 70,
          contextAnalyzed: true,
          requestTimestamp: '2025-01-30T10:00:00Z',
          responseTimestamp: '2025-01-30T10:00:03Z',
        },
      };

      server.use(
        http.post('*/api/v2/fix-suggestions/ai-suggestions', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.fixSuggestions.requestAiSuggestionsV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        maxAlternatives: 3,
      });

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0].confidence).toBeGreaterThan(result.suggestions[1].confidence);
      expect(result.suggestions[1].confidence).toBeGreaterThan(result.suggestions[2].confidence);
    });

    it('should handle fix style preferences', async () => {
      const mockResponse: AiSuggestionResponseV2 = {
        sessionId: 'fix-session-789',
        issue: {
          key: 'AY8qEqN7UVrTsQCOExjT',
          rule: 'java:S1234',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          message: 'Test message',
          component: 'test-component',
        },
        suggestions: [],
        metadata: {
          processingTime: 1500,
          modelUsed: 'sonar-ai-fix-model-v2.1',
          confidenceThreshold: 80,
          contextAnalyzed: false,
          requestTimestamp: '2025-01-30T10:00:00Z',
          responseTimestamp: '2025-01-30T10:00:01Z',
        },
      };

      let capturedRequestBody: Record<string, unknown>;
      server.use(
        http.post('*/api/v2/fix-suggestions/ai-suggestions', async ({ request }) => {
          capturedRequestBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.fixSuggestions.requestAiSuggestionsV2({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        fixStyle: 'minimal',
        priority: 'high',
        customContext: 'Focus on performance improvements',
      });

      expect(capturedRequestBody['fixStyle']).toBe('minimal');
      expect(capturedRequestBody['priority']).toBe('high');
      expect(capturedRequestBody['customContext']).toBe('Focus on performance improvements');
    });

    it('should handle server errors', async () => {
      server.use(
        http.post('*/api/v2/fix-suggestions/ai-suggestions', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(
        client.fixSuggestions.requestAiSuggestionsV2({
          issueKey: 'AY8qEqN7UVrTsQCOExjT',
        }),
      ).rejects.toThrow();
    });

    it('should handle AI service quota exceeded', async () => {
      server.use(
        http.post('*/api/v2/fix-suggestions/ai-suggestions', () => {
          return HttpResponse.json(
            {
              error: 'AI service quota exceeded',
              errorType: 'AI_QUOTA_EXCEEDED',
              resetTime: '2025-01-31T00:00:00Z',
            },
            { status: 429 },
          );
        }),
      );

      await expect(
        client.fixSuggestions.requestAiSuggestionsV2({
          issueKey: 'AY8qEqN7UVrTsQCOExjT',
        }),
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/v2/fix-suggestions/issues', () => {
          throw new Error('Network error');
        }),
      );

      await expect(
        client.fixSuggestions.getIssueAvailabilityV2({
          issueKey: 'AY8qEqN7UVrTsQCOExjT',
        }),
      ).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      server.use(
        http.get('*/api/v2/fix-suggestions/issues', () => {
          return HttpResponse.text('Invalid JSON response');
        }),
      );

      await expect(
        client.fixSuggestions.getIssueAvailabilityV2({
          issueKey: 'AY8qEqN7UVrTsQCOExjT',
        }),
      ).rejects.toThrow();
    });
  });
});
