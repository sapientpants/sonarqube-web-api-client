/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ValidationError } from '../../../errors';
import type { FixSuggestionsClient } from '../FixSuggestionsClient';
import { GetIssueAvailabilityV2BuilderImpl, RequestAiSuggestionsV2BuilderImpl } from '../builders';

// Mock the FixSuggestionsClient
const mockClient = {
  getIssueAvailabilityV2: jest.fn(),
  requestAiSuggestionsV2: jest.fn(),
} as unknown as FixSuggestionsClient;

describe('FixSuggestions Builders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GetIssueAvailabilityV2BuilderImpl', () => {
    it('should build availability check request with all parameters', async () => {
      const mockResponse = { available: true };
      (mockClient.getIssueAvailabilityV2 as jest.Mock).mockResolvedValue(mockResponse);

      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      const result = await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .inProject('my-project')
        .onBranch('main')
        .execute();

      expect(result).toEqual(mockResponse);
      expect(mockClient.getIssueAvailabilityV2).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
        branch: 'main',
      });
    });

    it('should build availability check request with pull request', async () => {
      const mockResponse = { available: true };
      (mockClient.getIssueAvailabilityV2 as jest.Mock).mockResolvedValue(mockResponse);

      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .inProject('my-project')
        .onPullRequest('123')
        .execute();

      expect(mockClient.getIssueAvailabilityV2).toHaveBeenCalledWith({
        issueKey: 'AY8qEqN7UVrTsQCOExjT',
        projectKey: 'my-project',
        pullRequest: '123',
      });
    });

    it('should validate required issue key', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow('Issue key is required');
    });

    it('should validate empty issue key', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(builder.withIssue('   ').execute()).rejects.toThrow(ValidationError);
      await expect(builder.withIssue('   ').execute()).rejects.toThrow('Issue key cannot be empty');
    });

    it('should validate branch and pull request conflict', async () => {
      const builder = new GetIssueAvailabilityV2BuilderImpl(mockClient);

      await expect(
        builder.withIssue('AY8qEqN7UVrTsQCOExjT').onBranch('main').onPullRequest('123').execute()
      ).rejects.toThrow(ValidationError);
      await expect(
        builder.withIssue('AY8qEqN7UVrTsQCOExjT').onBranch('main').onPullRequest('123').execute()
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
      (mockClient.requestAiSuggestionsV2 as jest.Mock).mockResolvedValue(mockResponse);

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
      expect(mockClient.requestAiSuggestionsV2).toHaveBeenCalledWith({
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
      (mockClient.requestAiSuggestionsV2 as jest.Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute();

      expect(mockClient.requestAiSuggestionsV2).toHaveBeenCalledWith({
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
        builder.withIssue('AY8qEqN7UVrTsQCOExjT').withCustomContext(longContext).execute()
      ).rejects.toThrow(ValidationError);
      await expect(
        builder.withIssue('AY8qEqN7UVrTsQCOExjT').withCustomContext(longContext).execute()
      ).rejects.toThrow('Custom context cannot exceed 1000 characters');
    });

    it('should validate required issue key', async () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow('Issue key is required');
    });

    it('should merge language preferences', async () => {
      const mockResponse = { sessionId: 'test', suggestions: [], metadata: {} };
      (mockClient.requestAiSuggestionsV2 as jest.Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder
        .withIssue('AY8qEqN7UVrTsQCOExjT')
        .withLanguagePreferences({ javaVersion: '11' })
        .withLanguagePreferences({ kotlinVersion: '1.9' })
        .execute();

      expect(mockClient.requestAiSuggestionsV2).toHaveBeenCalledWith(
        expect.objectContaining({
          languagePreferences: {
            javaVersion: '11',
            kotlinVersion: '1.9',
          },
        })
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
      (mockClient.requestAiSuggestionsV2 as jest.Mock).mockResolvedValue(mockResponse);

      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      await builder.withIssue('AY8qEqN7UVrTsQCOExjT').withContext(false).execute();

      expect(mockClient.requestAiSuggestionsV2).toHaveBeenCalledWith(
        expect.objectContaining({
          includeContext: false,
        })
      );
    });

    it('should validate max alternatives in execute', async () => {
      const builder = new RequestAiSuggestionsV2BuilderImpl(mockClient);

      // Manually set invalid value to test execute validation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (builder as any).params.maxAlternatives = 15;

      await expect(builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute()).rejects.toThrow(
        ValidationError
      );
      await expect(builder.withIssue('AY8qEqN7UVrTsQCOExjT').execute()).rejects.toThrow(
        'Maximum 10 alternatives allowed'
      );
    });
  });
});
