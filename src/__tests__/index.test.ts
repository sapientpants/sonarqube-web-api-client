import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SonarQubeClient } from '../index';
import { AuthenticationError } from '../errors';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('SonarQubeClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with base URL', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com');
      expect(client).toBeInstanceOf(SonarQubeClient);
    });

    it('should remove trailing slash from base URL', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com/');
      expect(client['baseUrl']).toBe('https://sonarqube.example.com');
    });

    it('should accept optional token', () => {
      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');
      expect(client['token']).toBe('test-token');
    });
  });

  describe('getProjects', () => {
    it('should fetch projects', async () => {
      const mockResponse = { components: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SonarQubeClient('https://sonarqube.example.com');
      const result = await client.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/projects/search',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      const headers = mockFetch.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token when provided', async () => {
      const mockResponse = { components: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SonarQubeClient('https://sonarqube.example.com', 'test-token');
      await client.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/projects/search',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      const headers = mockFetch.mock.calls[0]?.[1]?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('getIssues', () => {
    it('should fetch issues without project key', async () => {
      const mockResponse = { issues: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SonarQubeClient('https://sonarqube.example.com');
      const result = await client.getIssues();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/issues/search?',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch issues with project key', async () => {
      const mockResponse = { issues: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SonarQubeClient('https://sonarqube.example.com');
      const result = await client.getIssues('my-project');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/issues/search?componentKeys=my-project',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        text: async () => '',
      } as unknown as Response);

      const client = new SonarQubeClient('https://sonarqube.example.com');

      await expect(client.getIssues()).rejects.toThrow(AuthenticationError);
    });
  });
});
