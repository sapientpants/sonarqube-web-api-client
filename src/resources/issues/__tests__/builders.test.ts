import { IssuesClient } from '../IssuesClient';
import { SearchIssuesBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import type { Issue } from '../types';

describe('SearchIssuesBuilder', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: IssuesClient;
  let builder: SearchIssuesBuilder;

  beforeEach(() => {
    client = new IssuesClient(baseUrl, token);
    builder = client.search();
  });

  describe('fluent interface', () => {
    it('should build component filters', () => {
      const result = builder.withComponents(['comp1', 'comp2']).withProjects(['proj1', 'proj2']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build status and type filters', () => {
      const result = builder
        .withStatuses(['OPEN', 'CONFIRMED'])
        .withTypes(['BUG', 'VULNERABILITY'])
        .withSeverities(['MAJOR', 'CRITICAL']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build assignment filters', () => {
      const result = builder.assignedTo('john.doe').byAuthor('jane.smith');

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build date filters', () => {
      const result = builder
        .createdAfter('2024-01-01')
        .createdBefore('2024-12-31')
        .createdInLast('1w');

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build tag and language filters', () => {
      const result = builder
        .withTags(['security', 'performance'])
        .withLanguages(['typescript', 'javascript']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build branch and pull request filters', () => {
      const result = builder.onBranch('feature/my-branch').onPullRequest('5461');

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build boolean filters', () => {
      const result = builder.onlyAssigned().onlyResolved().inNewCodePeriod().onComponentOnly();

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should build sorting', () => {
      const result = builder
        .sortBy('SEVERITY', false)
        .withAdditionalFields(['transitions', 'actions']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });
  });

  describe('execute', () => {
    it('should execute search and return results', async () => {
      const response = await builder.withProjects(['project']).execute();

      expect(response.issues).toBeDefined();
      expect(response.paging).toBeDefined();
      expect(response.paging.pageIndex).toBe(1);
      expect(response.paging.pageSize).toBe(100);
    });

    it('should handle pagination parameters', async () => {
      const response = await builder.withProjects(['project']).page(2).pageSize(50).execute();

      expect(response.paging.pageIndex).toBe(2);
      expect(response.paging.pageSize).toBe(50);
    });

    it('should handle combined project and component filters', async () => {
      // Test that both filters work together (AND logic)
      const response = await builder
        .withProjects(['project'])
        .withComponents(['project:src/file.ts'])
        .execute();

      expect(response.issues).toBeDefined();
      // Should return issues that match both project AND component filters
      response.issues.forEach((issue) => {
        expect(issue.project).toBe('project');
        expect(issue.component).toContain('project:src/file.ts');
      });
    });

    it('should handle branch filtering', async () => {
      const response = await builder
        .withProjects(['project'])
        .onBranch('feature/new-feature')
        .execute();

      expect(response.issues).toBeDefined();
      // Should return issues from the specific branch
      response.issues.forEach((issue) => {
        expect(issue.project).toBe('project');
      });
    });

    it('should handle pull request filtering', async () => {
      const response = await builder.withProjects(['project']).onPullRequest('123').execute();

      expect(response.issues).toBeDefined();
      // Should return issues from the specific pull request
      response.issues.forEach((issue) => {
        expect(issue.project).toBe('project');
      });
    });

    it('should handle empty results', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
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

      const response = await builder.withProjects(['nonexistent']).execute();

      expect(response.issues).toHaveLength(0);
      expect(response.paging.total).toBe(0);
    });
  });

  describe('async iteration', () => {
    beforeEach(() => {
      // Set up mock data for multiple pages
      server.use(
        http.get('*/api/issues/search', ({ request }) => {
          const url = new URL(request.url);
          const page = Number(url.searchParams.get('p')) || 1;
          const pageSize = Number(url.searchParams.get('ps')) || 100;

          // Simulate 3 pages with 2 issues each
          const allIssues: Issue[] = [
            {
              key: 'issue-1',
              rule: 'typescript:S1234',
              severity: 'MAJOR',
              component: 'project:src/file1.ts',
              project: 'project',
              line: 10,
              message: 'Issue 1',
              type: 'BUG',
              status: 'OPEN',
              tags: [],
              creationDate: '2024-01-01T00:00:00+0000',
              updateDate: '2024-01-01T00:00:00+0000',
            },
            {
              key: 'issue-2',
              rule: 'typescript:S5678',
              severity: 'CRITICAL',
              component: 'project:src/file2.ts',
              project: 'project',
              line: 20,
              message: 'Issue 2',
              type: 'VULNERABILITY',
              status: 'OPEN',
              tags: ['security'],
              creationDate: '2024-01-02T00:00:00+0000',
              updateDate: '2024-01-02T00:00:00+0000',
            },
            {
              key: 'issue-3',
              rule: 'typescript:S9999',
              severity: 'MINOR',
              component: 'project:src/file3.ts',
              project: 'project',
              line: 30,
              message: 'Issue 3',
              type: 'CODE_SMELL',
              status: 'CONFIRMED',
              tags: [],
              creationDate: '2024-01-03T00:00:00+0000',
              updateDate: '2024-01-03T00:00:00+0000',
            },
            {
              key: 'issue-4',
              rule: 'typescript:S1111',
              severity: 'BLOCKER',
              component: 'project:src/file4.ts',
              project: 'project',
              line: 40,
              message: 'Issue 4',
              type: 'BUG',
              status: 'REOPENED',
              tags: ['performance'],
              creationDate: '2024-01-04T00:00:00+0000',
              updateDate: '2024-01-04T00:00:00+0000',
            },
            {
              key: 'issue-5',
              rule: 'typescript:S2222',
              severity: 'INFO',
              component: 'project:src/file5.ts',
              project: 'project',
              line: 50,
              message: 'Issue 5',
              type: 'CODE_SMELL',
              status: 'RESOLVED',
              tags: [],
              creationDate: '2024-01-05T00:00:00+0000',
              updateDate: '2024-01-05T00:00:00+0000',
            },
          ];

          const startIndex = (page - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, allIssues.length);
          const paginatedIssues = allIssues.slice(startIndex, endIndex);

          return HttpResponse.json({
            issues: paginatedIssues,
            paging: {
              pageIndex: page,
              pageSize,
              total: allIssues.length,
            },
            components: [],
            rules: [],
            users: [],
          });
        })
      );
    });

    it('should iterate through all pages', async () => {
      const allIssues: Issue[] = [];

      for await (const issue of builder.withProjects(['project']).pageSize(2).all()) {
        allIssues.push(issue);
      }

      expect(allIssues).toHaveLength(5);
      expect(allIssues[0].key).toBe('issue-1');
      expect(allIssues[4].key).toBe('issue-5');
    });

    it('should support early termination', async () => {
      const collectedIssues: Issue[] = [];

      for await (const issue of builder.withProjects(['project']).pageSize(2).all()) {
        collectedIssues.push(issue);
        if (collectedIssues.length >= 3) {
          break;
        }
      }

      expect(collectedIssues).toHaveLength(3);
      expect(collectedIssues[0].key).toBe('issue-1');
      expect(collectedIssues[2].key).toBe('issue-3');
    });

    it('should handle empty iteration', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
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

      const allIssues: Issue[] = [];

      for await (const issue of builder.withProjects(['empty-project']).all()) {
        allIssues.push(issue);
      }

      expect(allIssues).toHaveLength(0);
    });

    it('should handle single page results', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
          return HttpResponse.json({
            issues: [
              {
                key: 'single-issue',
                rule: 'typescript:S1234',
                severity: 'MAJOR',
                component: 'project:src/file.ts',
                project: 'project',
                line: 42,
                message: 'Single issue',
                type: 'BUG',
                status: 'OPEN',
                tags: [],
                creationDate: '2024-01-01T00:00:00+0000',
                updateDate: '2024-01-01T00:00:00+0000',
              },
            ],
            paging: {
              pageIndex: 1,
              pageSize: 100,
              total: 1,
            },
            components: [],
            rules: [],
            users: [],
          });
        })
      );

      const allIssues: Issue[] = [];

      for await (const issue of builder.withProjects(['single-issue-project']).all()) {
        allIssues.push(issue);
      }

      expect(allIssues).toHaveLength(1);
      expect(allIssues[0].key).toBe('single-issue');
    });
  });

  describe('parameter building', () => {
    it('should handle multiple assignees', () => {
      const result = builder.assignedToAny(['user1', 'user2', 'user3']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle multiple authors', () => {
      const result = builder.byAuthors(['author1', 'author2']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle resolution filters', () => {
      const result = builder.withResolutions(['FALSE-POSITIVE', 'WONTFIX']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle rule filters', () => {
      const result = builder.withRules(['typescript:S1234', 'typescript:S5678']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle security category filters', () => {
      const result = builder
        .withCwe(['79', '89'])
        .withOwaspTop10(['a1', 'a2'])
        .withSansTop25(['risky-resource', 'porous-defenses'])
        .withSonarSourceSecurity(['sql-injection', 'xss']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle facets and additional fields', () => {
      const result = builder
        .withFacets(['severities', 'types', 'tags'])
        .withAdditionalFields(['transitions', 'actions', 'comments']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle Clean Code taxonomy filters', () => {
      const result = builder
        .withCleanCodeAttributeCategories(['ADAPTABLE', 'CONSISTENT'])
        .withImpactSeverities(['HIGH', 'MEDIUM'])
        .withImpactSoftwareQualities(['MAINTAINABILITY', 'SECURITY'])
        .withIssueStatuses(['OPEN', 'CONFIRMED']);

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should handle organization and OWASP 2021 filters', () => {
      const result = builder
        .inOrganization('my-org')
        .withOwaspTop10v2021(['a1', 'a2'])
        .withFacetMode('effort');

      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });
  });

  describe('error handling', () => {
    it('should throw on server error during search', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(builder.withProjects(['project']).execute()).rejects.toThrow();
    });

    it('should throw on server error during iteration', async () => {
      server.use(
        http.get('*/api/issues/search', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const iterator = builder.withProjects(['project']).all();

      await expect(iterator.next()).rejects.toThrow();
    });

    it('should handle unauthorized requests', async () => {
      const unauthorizedClient = new IssuesClient(baseUrl, 'invalid-token');
      const unauthorizedBuilder = unauthorizedClient.search();

      await expect(unauthorizedBuilder.withProjects(['project']).execute()).rejects.toThrow();
    });
  });

  describe('alias methods', () => {
    it('should support organization() alias for inOrganization()', () => {
      const result = builder.organization('my-org');
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should support componentKeys() alias for withComponents()', () => {
      const result = builder.componentKeys(['comp1', 'comp2']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });

    it('should support rules() alias for withRules()', () => {
      const result = builder.rules(['rule1', 'rule2']);
      expect(result).toBeInstanceOf(SearchIssuesBuilder);
    });
  });
});
