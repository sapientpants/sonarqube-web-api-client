// @ts-nocheck
/* eslint-disable @typescript-eslint/unbound-method */
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

import { ValidationError } from '../../../../src/errors/index.js';
import type { FixSuggestionsClient } from '../../../../src/resources/fix-suggestions/FixSuggestionsClient.js';
import {
  GetIssueAvailabilityV2BuilderImpl,
  RequestAiSuggestionsV2BuilderImpl,
} from '../../../../src/resources/fix-suggestions/builders.js';

// Mock the FixSuggestionsClient
const mockClient = {
  getIssueAvailabilityV2: vi.fn(),
  requestAiSuggestionsV2: vi.fn(),
} as unknown as FixSuggestionsClient;

describe('FixSuggestions Builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GetIssueAvailabilityV2BuilderImpl', () => {
    it('should build availability check request with all parameters', async () => {
      const mockResponse = { available: true };
      (mockClient.getIssueAvailabilityV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      const result = await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .inProject('my-project')
        .onBranch('main')
        .execute();

      expect(result).toEqual(mockResponse);
      const mockFn = mockClient.getIssueAvailabilityV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
        branch: 'main',
      });
    });

    it('should build availability check request with pull request', async () => {
      const mockResponse = { available: true };
      (mockClient.getIssueAvailabilityV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .inProject('my-project')
        .onPullRequest('123')
        .execute();

      const mockFn = mockClient.getIssueAvailabilityV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
        pullRequest: '123',
      });
    });

    it('should validate required issue key', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(async () => await builder.execute()).rejects.toThrow(ValidationError);
      await expect(async () => await builder.execute()).rejects.toThrow('Issue key is required');
    });

    it('should validate empty issue key', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(async () => await builder.withIssue('   ').execute()).rejects.toThrow(
        ValidationError,
      );
      await expect(async () => await builder.withIssue('   ').execute()).rejects.toThrow(
        'Issue key cannot be empty',
      );
    });

    it('should validate branch and pull request conflict', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(
        async () =>
          await builder
            .withIssue('AY8qEqN7UVrTsQCOExjT')
            .onBranch('main')
            .onPullRequest('123')
            .execute(),
      ).rejects.toThrow(ValidationError);
      await expect(
        async () =>
          await builder
            .withIssue('AY8qEqN7UVrTsQCOExjT')
            .onBranch('main')
            .onPullRequest('123')
            .execute(),
      ).rejects.toThrow('Cannot specify both branch and pull request');
    });

    it('should support method chaining', () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      const result = builder.withIssue('test').inProject('project').onBranch('branch');

      expect(result).toBe(builder);
    });
  });

  describe('RequestAiSuggestionsV2BuilderImpl', () => {
    it('should build AI suggestions request with all parameters', async () => {
      const mockResponse = { sessionId: 'test', suggestions: [], metadata: {} };
      (mockClient.requestAiSuggestionsV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      const result = await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .withContext(true)
        .withMaxAlternatives(5)
        .withFixStyle('minimal')
        .withPriority('high')
        .withCustomContext('Focus on performance')
        .withLanguagePreferences({ javaVersion: '11' })
        .execute();

      expect(result).toEqual(mockResponse);
      const mockFn = mockClient.requestAiSuggestionsV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        includeContext: true,
        maxAlternatives: 5,
        fixStyle: 'minimal',
        priority: 'high',
        customContext: 'Focus on performance',
        languagePreferences: { javaVersion: '11' },
      });
    });

    it('should set sensible defaults', async () => {
      const mockResponse = { sessionId: 'test', suggestions: [], metadata: {} };
      (mockClient.requestAiSuggestionsV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute();

      const mockFn = mockClient.requestAiSuggestionsV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        includeContext: true,
        maxAlternatives: 3,
        fixStyle: 'comprehensive',
        priority: 'normal',
      });
    });

    it('should validate max alternatives range', () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      expect(() => {
        builder.withMaxAlternatives(0);
      }).toThrow(ValidationError);
      expect(() => {
        builder.withMaxAlternatives(0);
      }).toThrow('Max alternatives must be between 1 and 10');

      expect(() => {
        builder.withMaxAlternatives(11);
      }).toThrow(ValidationError);
      expect(() => {
        builder.withMaxAlternatives(11);
      }).toThrow('Max alternatives must be between 1 and 10');
    });

    it('should validate empty custom context', () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      expect(() => {
        builder.withCustomContext('   ');
      }).toThrow(ValidationError);
      expect(() => {
        builder.withCustomContext('   ');
      }).toThrow('Custom context cannot be empty');
    });

    it('should validate custom context length', async () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);
      const longContext = 'a'.repeat(1001);

      await expect(
        async () =>
          await builder.withIssue('AY8qEqN7UVrTsQCOExjT').withCustomContext(longContext).execute(),
      ).rejects.toThrow(ValidationError);
      await expect(
        async () =>
          await builder.withIssue('AY8qEqN7UVrTsQCOExjT').withCustomContext(longContext).execute(),
      ).rejects.toThrow('Custom context cannot exceed 1000 characters');
    });

    it('should validate required issue key', async () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await expect(async () => await builder.execute()).rejects.toThrow(ValidationError);
      await expect(async () => await builder.execute()).rejects.toThrow('Issue key is required');
    });

    it('should merge language preferences', async () => {
      const mockResponse = { sessionId: 'test', suggestions: [], metadata: {} };
      (mockClient.requestAiSuggestionsV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .withLanguagePreferences({ javaVersion: '11' })
        .withLanguagePreferences({ kotlinVersion: '1.9' })
        .execute();

      const mockFn = mockClient.requestAiSuggestionsV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          languagePreferences: {
            javaVersion: '11',
            kotlinVersion: '1.9',
          },
        }),
      );
    });

    it('should support method chaining', () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      const result = builder
        .withIssue('test')
        .withContext(true)
        .withMaxAlternatives(2)
        .withFixStyle('defensive');

      expect(result).toBe(builder);
    });

    it('should allow setting context to false', async () => {
      const mockResponse = { sessionId: 'test', suggestions: [], metadata: {} };
      (mockClient.requestAiSuggestionsV2 as Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder.withIssue('AY8qEqN7UVrTsQCOExjT').withContext(false).execute();

      const mockFn = mockClient.requestAiSuggestionsV2 as Mock;
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          includeContext: false,
        }),
      );
    });

    it('should validate max alternatives in execute', async () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      // Manually set invalid value to test execute validation

      (builder as any).params.maxAlternatives = 15;

      await expect(
        async () => await builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute(),
      ).rejects.toThrow(ValidationError);
      await expect(
        async () => await builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute(),
      ).rejects.toThrow('Maximum 10 alternatives allowed');
    });
  });
});
