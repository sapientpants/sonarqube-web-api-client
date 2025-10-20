// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { LanguagesClient } from '../../../../src/resources/languages/LanguagesClient.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import type { Language } from '../../../../src/resources/languages/types.js';
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from '../../../../src/errors/index.js';
import { createApiError, createErrorResponse } from '../../../../src/test-utils/msw/factories.js';

const createLanguage = (overrides: Partial<Language> = {}): Language => ({
  key: 'java',
  name: 'Java',
  ...overrides,
});

const createLanguagesResponse = (languages: Language[]): { languages: Language[] } => ({
  languages,
});

const SAMPLE_LANGUAGES: Record<string, Language> = {
  java: createLanguage({ key: 'java', name: 'Java' }),
  js: createLanguage({ key: 'js', name: 'JavaScript' }),
  ts: createLanguage({ key: 'ts', name: 'TypeScript' }),
  python: createLanguage({ key: 'py', name: 'Python' }),
  csharp: createLanguage({ key: 'cs', name: 'C#' }),
};

describe('LanguagesClient', () => {
  let client: LanguagesClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new LanguagesClient(baseUrl, token);
  });

  describe('list', () => {
    it('should return languages with default parameters', async () => {
      const mockResponse = createLanguagesResponse([
        SAMPLE_LANGUAGES.java,
        SAMPLE_LANGUAGES.js,
        SAMPLE_LANGUAGES.python,
      ]);

      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.list();

      expect(result).toEqual(mockResponse);
      expect(result.languages).toHaveLength(3);
      expect(result.languages[0].key).toBe('java');
      expect(result.languages[0].name).toBe('Java');
    });

    it('should handle list parameters correctly', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/languages/list`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            languages: [SAMPLE_LANGUAGES.java],
          });
        }),
      );

      await client.list({
        ps: 25,
        q: 'java',
      });

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).not.toBeNull();

      const params = capturedUrl!.searchParams;
      expect(params.get('ps')).toBe('25');
      expect(params.get('q')).toBe('java');
    });

    it('should handle empty results', async () => {
      const mockResponse = createLanguagesResponse([]);

      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.list();

      expect(result.languages).toEqual([]);
    });

    it('should handle query parameter filtering', async () => {
      const mockResponse = createLanguagesResponse([SAMPLE_LANGUAGES.java, SAMPLE_LANGUAGES.js]);

      server.use(
        http.get(`${baseUrl}/api/languages/list`, ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q');
          expect(query).toBe('j');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.list({ q: 'j' });

      expect(result.languages).toHaveLength(2);
      expect(result.languages.some((lang) => lang.key === 'java')).toBe(true);
      expect(result.languages.some((lang) => lang.key === 'js')).toBe(true);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(
            createErrorResponse([createApiError('Authentication required')]),
            { status: 401 },
          );
        }),
      );

      await expect(client.list()).rejects.toThrow(AuthenticationError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Internal server error')]), {
            status: 500,
          });
        }),
      );

      await expect(client.list()).rejects.toThrow(ServerError);
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Rate limit exceeded')]), {
            status: 429,
            headers: { 'Retry-After': '60' },
          });
        }),
      );

      try {
        await client.list();
        fail('Expected RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Not found')]), {
            status: 404,
          });
        }),
      );

      await expect(client.list()).rejects.toThrow(NotFoundError);
    });
  });

  describe('listAll', () => {
    it('should iterate through all languages', async () => {
      const allLanguages = Object.values(SAMPLE_LANGUAGES);
      const mockResponse = createLanguagesResponse(allLanguages);

      server.use(
        http.get(`${baseUrl}/api/languages/list`, ({ request }) => {
          const url = new URL(request.url);
          const ps = url.searchParams.get('ps');
          expect(ps).toBe('0'); // Should request all languages
          return HttpResponse.json(mockResponse);
        }),
      );

      const collectedLanguages: Language[] = [];

      for await (const language of client.listAll()) {
        collectedLanguages.push(language);
      }

      expect(collectedLanguages).toHaveLength(5);
      expect(collectedLanguages).toEqual(allLanguages);
    });

    it('should pass through query parameter', async () => {
      const filteredLanguages = [SAMPLE_LANGUAGES.java, SAMPLE_LANGUAGES.js];
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/languages/list`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json(createLanguagesResponse(filteredLanguages));
        }),
      );

      const languages: Language[] = [];

      for await (const language of client.listAll({ q: 'j' })) {
        languages.push(language);
      }

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).not.toBeNull();

      const params = capturedUrl!.searchParams;
      expect(params.get('q')).toBe('j');
      expect(params.get('ps')).toBe('0');
      expect(languages).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(createLanguagesResponse([]));
        }),
      );

      const languages: Language[] = [];

      for await (const language of client.listAll()) {
        languages.push(language);
      }

      expect(languages).toHaveLength(0);
    });

    it('should propagate errors during iteration', async () => {
      server.use(
        http.get(`${baseUrl}/api/languages/list`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Server error')]), {
            status: 500,
          });
        }),
      );

      const languages: Language[] = [];

      await expect(async () => {
        for await (const language of client.listAll()) {
          languages.push(language);
        }
      }).rejects.toThrow(ServerError);

      expect(languages).toHaveLength(0);
    });
  });
});
