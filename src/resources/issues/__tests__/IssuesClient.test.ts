import { IssuesClient } from '../IssuesClient';
import { SearchIssuesBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import type { IssueTransition } from '../types';
import { IndexingInProgressError } from '../../../errors';

describe('IssuesClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: IssuesClient;

  beforeEach(() => {
    client = new IssuesClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return a SearchIssuesBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchIssuesBuilder);
    });
  });

  describe('addComment', () => {
    it('should add a comment to an issue successfully', async () => {
      const result = await client.addComment({
        issue: 'issue-1',
        text: 'This is a comment',
        isFeedback: false,
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments).toHaveLength(1);
      expect(result.issue.comments?.[0].markdown).toBe('This is a comment');
    });

    it('should handle feedback comments', async () => {
      const result = await client.addComment({
        issue: 'issue-1',
        text: 'This is feedback',
        isFeedback: true,
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments).toHaveLength(1);
      expect(result.issue.comments?.[0].markdown).toBe('This is feedback');
    });

    it('should throw on server error', async () => {
      server.use(
        http.post('*/api/issues/add_comment', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        client.addComment({
          issue: 'issue-1',
          text: 'This will fail',
        })
      ).rejects.toThrow();
    });
  });

  describe('assign', () => {
    it('should assign an issue to a user', async () => {
      const result = await client.assign({
        issue: 'issue-1',
        assignee: 'john.doe',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.assignee).toBe('john.doe');
    });

    it('should unassign an issue when no assignee is provided', async () => {
      const result = await client.assign({
        issue: 'issue-1',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.assignee).toBeUndefined();
    });

    it('should throw on authentication error', async () => {
      server.use(
        http.post('*/api/issues/assign', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Unauthorized' }] }), {
            status: 401,
          });
        })
      );

      await expect(
        client.assign({
          issue: 'issue-1',
          assignee: 'john.doe',
        })
      ).rejects.toThrow();
    });
  });

  describe('doTransition', () => {
    it('should perform a confirm transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'confirm',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('CONFIRMED');
    });

    it('should perform a resolve transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'resolve',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('RESOLVED');
      expect(result.issue.resolution).toBe('FIXED');
    });

    it('should perform a false positive transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'falsepositive',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('RESOLVED');
      expect(result.issue.resolution).toBe('FALSE-POSITIVE');
    });

    it('should throw on invalid transition', async () => {
      server.use(
        http.post('*/api/issues/do_transition', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Invalid transition' }] }), {
            status: 400,
          });
        })
      );

      await expect(
        client.doTransition({
          issue: 'issue-1',
          transition: 'invalid' as IssueTransition,
        })
      ).rejects.toThrow();
    });
  });

  describe('setTags', () => {
    it('should set tags on an issue', async () => {
      const result = await client.setTags({
        issue: 'issue-1',
        tags: ['security', 'performance'],
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.tags).toEqual(['security', 'performance']);
    });

    it('should clear tags when empty array is provided', async () => {
      const result = await client.setTags({
        issue: 'issue-1',
        tags: [],
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.tags).toEqual([]);
    });

    it('should throw on permission error', async () => {
      server.use(
        http.post('*/api/issues/set_tags', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Forbidden' }] }), {
            status: 403,
          });
        })
      );

      await expect(
        client.setTags({
          issue: 'issue-1',
          tags: ['security'],
        })
      ).rejects.toThrow();
    });
  });

  describe('searchAuthors', () => {
    it('should search for authors with query', async () => {
      const result = await client.searchAuthors({
        q: 'john',
        ps: 10,
        project: 'test-project',
      });

      expect(result.authors).toEqual(['john.doe', 'john.smith']);
    });

    it('should search for authors with minimal parameters', async () => {
      const result = await client.searchAuthors();

      expect(result.authors).toBeDefined();
      expect(Array.isArray(result.authors)).toBe(true);
    });

    it('should handle IndexingInProgressError on 503', async () => {
      server.use(
        http.get('*/api/issues/authors', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Issues indexing in progress' }] }),
            {
              status: 503,
              headers: {
                'content-type': 'application/json',
              },
            }
          );
        })
      );

      await expect(client.searchAuthors()).rejects.toThrow(IndexingInProgressError);
    });

    it('should validate query length', async () => {
      await expect(client.searchAuthors({ q: 'a' })).rejects.toThrow(
        'Parameter "q" (query) must be at least 2 characters long'
      );
    });

    it('should validate page size limits', async () => {
      await expect(client.searchAuthors({ ps: 101 })).rejects.toThrow(
        'Parameter "ps" (page size) must be between 1 and 100'
      );
    });
  });

  describe('bulkChange', () => {
    it('should perform bulk change on multiple issues', async () => {
      const result = await client.bulkChange({
        issues: ['issue-1', 'issue-2', 'issue-3'],
        add_tags: ['security'],
        set_severity: 'CRITICAL',
        assign: 'john.doe',
        comment: 'Bulk update applied',
      });

      expect(result.total).toBe(3);
      expect(result.success).toBe(3);
      expect(result.failures).toBe(0);
      expect(result.issues).toHaveLength(3);
    });

    it('should validate issues array length', async () => {
      await expect(client.bulkChange({ issues: [] })).rejects.toThrow(
        'Parameter "issues" is required and must contain at least one issue key'
      );
    });

    it('should validate maximum issues limit', async () => {
      const manyIssues = Array.from({ length: 501 }, (_, i) => `issue-${String(i)}`);
      await expect(client.bulkChange({ issues: manyIssues })).rejects.toThrow(
        'Parameter "issues" cannot contain more than 500 issue keys'
      );
    });

    it('should require at least one action', async () => {
      await expect(client.bulkChange({ issues: ['issue-1'] })).rejects.toThrow(
        'At least one action must be specified'
      );
    });

    it('should validate tag limits', async () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag-${String(i)}`);
      await expect(client.bulkChange({ issues: ['issue-1'], add_tags: manyTags })).rejects.toThrow(
        'Parameter "add_tags" cannot contain more than 10 tags'
      );
    });
  });

  describe('getChangelog', () => {
    it('should get changelog for an issue', async () => {
      const result = await client.getChangelog({ issue: 'issue-1' });

      expect(result.changelog).toBeDefined();
      expect(Array.isArray(result.changelog)).toBe(true);
      expect(result.changelog[0]).toHaveProperty('user');
      expect(result.changelog[0]).toHaveProperty('creationDate');
      expect(result.changelog[0]).toHaveProperty('diffs');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const result = await client.deleteComment({ comment: 'comment-1' });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments).toHaveLength(0);
    });
  });

  describe('editComment', () => {
    it('should edit a comment', async () => {
      const result = await client.editComment({
        comment: 'comment-1',
        text: 'Updated comment text',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments?.[0].markdown).toBe('Updated comment text');
    });
  });

  describe('gitLabSastExport', () => {
    it('should export vulnerabilities in GitLab SAST format', async () => {
      const result = await client.gitLabSastExport({
        project: 'test-project',
        branch: 'main',
      });

      expect(result.version).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should export for pull request', async () => {
      const result = await client.gitLabSastExport({
        project: 'test-project',
        pullRequest: '123',
      });

      expect(result.version).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('reindex', () => {
    it('should reindex issues for a project', async () => {
      const result = await client.reindex({ project: 'test-project' });

      expect(result.message).toBe('Issues reindexed successfully');
    });
  });

  describe('setSeverity', () => {
    it('should set issue severity', async () => {
      const result = await client.setSeverity({
        issue: 'issue-1',
        severity: 'CRITICAL',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.severity).toBe('CRITICAL');
    });
  });

  describe('searchTags', () => {
    it('should search for tags with query', async () => {
      const result = await client.searchTags({
        q: 'sec',
        ps: 20,
        organization: 'test-org',
      });

      expect(result.tags).toEqual(['security', 'secure-coding']);
    });

    it('should search tags with minimal parameters', async () => {
      const result = await client.searchTags();

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it('should validate query length', async () => {
      await expect(client.searchTags({ q: 'a' })).rejects.toThrow(
        'Parameter "q" (query) must be at least 2 characters long'
      );
    });

    it('should validate page size limits', async () => {
      await expect(client.searchTags({ ps: 101 })).rejects.toThrow(
        'Parameter "ps" (page size) must be between 1 and 100'
      );
    });
  });

  describe('search parameter validation', () => {
    it('should validate fixedInPullRequest constraints', async () => {
      const builder = client.search();

      await expect(
        builder.fixedInPullRequest('123').onPullRequest('456').execute()
      ).rejects.toThrow(
        'Parameters "fixedInPullRequest" and "pullRequest" cannot be used together'
      );
    });

    it('should require components when using fixedInPullRequest', async () => {
      const builder = client.search();

      await expect(builder.fixedInPullRequest('123').execute()).rejects.toThrow(
        'Parameter "fixedInPullRequest" requires "components" to be specified'
      );
    });

    it('should validate page size limits', async () => {
      const builder = client.search();

      await expect(builder.page(1).pageSize(501).execute()).rejects.toThrow(
        'Parameter "ps" (page size) must be between 1 and 500'
      );
    });

    it('should validate page number', async () => {
      const builder = client.search();

      await expect(builder.page(0).pageSize(100).execute()).rejects.toThrow(
        'Parameter "p" (page number) must be greater than 0'
      );
    });

    it('should validate OWASP ASVS level', async () => {
      const builder = client.search();

      await expect(builder.withOwaspAsvsLevel(4 as 1 | 2 | 3).execute()).rejects.toThrow(
        'Parameter "owaspAsvsLevel" must be 1, 2, or 3'
      );
    });

    it('should validate date formats', async () => {
      const builder = client.search();

      await expect(builder.createdAfter('invalid-date').execute()).rejects.toThrow(
        'Parameter "createdAfter" must be in YYYY-MM-DD format'
      );
    });

    it('should validate createdInLast format', async () => {
      const builder = client.search();

      await expect(builder.createdInLast('invalid').execute()).rejects.toThrow(
        'Parameter "createdInLast" must be in format like "1w", "30d", "6m", "1y", or "24h"'
      );
    });

    it('should validate timezone format', async () => {
      const builder = client.search();

      await expect(builder.withTimeZone('invalid-timezone').execute()).rejects.toThrow(
        'Parameter "timeZone" must be a valid timezone identifier'
      );
    });

    it('should validate array parameter limits', async () => {
      const builder = client.search();
      const manyComponents = Array.from({ length: 101 }, (_, i) => `component-${String(i)}`);

      await expect(builder.withComponents(manyComponents).execute()).rejects.toThrow(
        'Parameter "components" cannot contain more than 100 items'
      );
    });

    it('should validate CWE format', async () => {
      const builder = client.search();

      await expect(builder.withCwe(['invalid-cwe']).execute()).rejects.toThrow(
        'Parameter "cwe" must contain only numeric CWE identifiers'
      );
    });
  });

  describe('deprecation warnings', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should warn about deprecated componentKeys parameter', async () => {
      const builder = client.search();

      await builder.componentKeys(['component-1']).execute();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('issues.search() parameter "componentKeys"')
      );
    });

    it('should warn about deprecated statuses parameter', async () => {
      const builder = client.search();

      await builder.withStatuses(['OPEN']).execute();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('issues.search() parameter "statuses"')
      );
    });

    it('should warn about deprecated severities parameter', async () => {
      const builder = client.search();

      await builder.withSeverities(['MAJOR']).execute();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('issues.search() parameter "severities"')
      );
    });
  });

  describe('author parameter handling', () => {
    it('should handle multiple authors correctly', async () => {
      // Mock the request to verify proper parameter handling
      server.use(
        http.get('*/api/issues/search', ({ request }) => {
          const url = new URL(request.url);
          const authorParams = url.searchParams.getAll('author');
          expect(authorParams).toEqual(['user1', 'user2']);

          return HttpResponse.json({
            issues: [],
            paging: {
              pageIndex: 1,
              pageSize: 100,
              total: 0,
            },
            components: [],
            rules: [],
            users: [],
          });
        })
      );

      const response = await client.search().byAuthors(['user1', 'user2']).execute();
      expect(response.issues).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.post('*/api/issues/add_comment', () => {
          return HttpResponse.error();
        })
      );

      await expect(
        client.addComment({
          issue: 'issue-1',
          text: 'Test comment',
        })
      ).rejects.toThrow();
    });

    it('should handle unauthorized requests', async () => {
      const unauthorizedClient = new IssuesClient(baseUrl, 'invalid-token');

      await expect(
        unauthorizedClient.addComment({
          issue: 'issue-1',
          text: 'Test comment',
        })
      ).rejects.toThrow();
    });

    it('should handle IndexingInProgressError for search', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Issues indexing in progress' }] }),
            {
              status: 503,
              headers: {
                'content-type': 'application/json',
              },
            }
          );
        })
      );

      await expect(client.search().execute()).rejects.toThrow(IndexingInProgressError);
    });
  });
});
