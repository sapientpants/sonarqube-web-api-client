import { SearchRulesBuilder } from '../builders';
import type { SearchRulesRequest, SearchRulesResponse } from '../types';

describe('SearchRulesBuilder', () => {
  let builder: SearchRulesBuilder;
  let mockExecutor: jest.Mock<Promise<SearchRulesResponse>, [SearchRulesRequest]>;

  beforeEach(() => {
    mockExecutor = jest.fn<Promise<SearchRulesResponse>, [SearchRulesRequest]>().mockResolvedValue({
      total: 0,
      p: 1,
      ps: 100,
      rules: [],
    });
    builder = new SearchRulesBuilder(mockExecutor);
  });

  describe('filter methods', () => {
    it('should set activation filter', () => {
      builder.withActivation(true);
      expect(builder['params'].activation).toBe(true);
    });

    it('should set active severities filter', () => {
      builder.withActiveSeverities(['CRITICAL', 'BLOCKER']);
      expect(builder['params'].active_severities).toEqual(['CRITICAL', 'BLOCKER']);
    });

    it('should set available since date filter', () => {
      builder.availableSince('2024-01-01');
      expect(builder['params'].available_since).toBe('2024-01-01');
    });

    it('should set clean code attribute categories filter', () => {
      builder.withCleanCodeAttributeCategories(['INTENTIONAL', 'CONSISTENT']);
      expect(builder['params'].cleanCodeAttributeCategories).toEqual(['INTENTIONAL', 'CONSISTENT']);
    });

    it('should set CWE filter', () => {
      builder.withCwe(['CWE-89', 'CWE-79']);
      expect(builder['params'].cwe).toEqual(['CWE-89', 'CWE-79']);
    });

    it('should set fields to return', () => {
      builder.withFields(['name', 'severity', 'tags']);
      expect(builder['params'].f).toEqual(['name', 'severity', 'tags']);
    });

    it('should set facets', () => {
      builder.withFacets(['languages', 'repositories']);
      expect(builder['params'].facets).toEqual(['languages', 'repositories']);
    });

    it('should set impact severities filter', () => {
      builder.withImpactSeverities(['HIGH', 'MEDIUM']);
      expect(builder['params'].impactSeverities).toEqual(['HIGH', 'MEDIUM']);
    });

    it('should set impact software qualities filter', () => {
      builder.withImpactSoftwareQualities(['SECURITY', 'RELIABILITY']);
      expect(builder['params'].impactSoftwareQualities).toEqual(['SECURITY', 'RELIABILITY']);
    });

    it('should set include external flag', () => {
      builder.includeExternal();
      expect(builder['params'].include_external).toBe(true);

      builder.includeExternal(false);
      expect(builder['params'].include_external).toBe(false);
    });

    it('should set inheritance filter', () => {
      builder.withInheritance(['INHERITED', 'OVERRIDES']);
      expect(builder['params'].inheritance).toEqual(['INHERITED', 'OVERRIDES']);
    });

    it('should set template filter', () => {
      builder.isTemplate(true);
      expect(builder['params'].is_template).toBe(true);
    });

    it('should set languages filter', () => {
      builder.withLanguages(['java', 'javascript']);
      expect(builder['params'].languages).toEqual(['java', 'javascript']);
    });

    it('should set organization filter', () => {
      builder.inOrganization('my-org');
      expect(builder['params'].organization).toBe('my-org');
    });

    it('should set OWASP Top 10 filter', () => {
      builder.withOwaspTop10(['a1', 'a2']);
      expect(builder['params'].owaspTop10).toEqual(['a1', 'a2']);
    });

    it('should set OWASP Top 10 2021 filter', () => {
      builder.withOwaspTop10v2021(['a1', 'a2']);
      expect(builder['params']['owaspTop10-2021']).toEqual(['a1', 'a2']);
    });

    it('should set query string', () => {
      builder.withQuery('xpath');
      expect(builder['params'].q).toBe('xpath');
    });

    it('should set quality profile filter', () => {
      builder.inQualityProfile('profile-key');
      expect(builder['params'].qprofile).toBe('profile-key');
    });

    it('should set repositories filter', () => {
      builder.withRepositories(['java', 'javascript']);
      expect(builder['params'].repositories).toEqual(['java', 'javascript']);
    });

    it('should set single rule key filter', () => {
      builder.withRuleKey('java:S1234');
      expect(builder['params'].rule_key).toBe('java:S1234');
    });

    it('should set multiple rule keys filter', () => {
      builder.withRuleKeys(['java:S1234', 'java:S5678']);
      expect(builder['params'].rule_keys).toEqual(['java:S1234', 'java:S5678']);
    });

    it('should set sort parameters', () => {
      builder.sortBy('name');
      expect(builder['params'].s).toBe('name');
      expect(builder['params'].asc).toBe(true);

      builder.sortBy('updatedAt', false);
      expect(builder['params'].s).toBe('updatedAt');
      expect(builder['params'].asc).toBe(false);
    });

    it('should set severities filter', () => {
      builder.withSeverities(['MAJOR', 'CRITICAL']);
      expect(builder['params'].severities).toEqual(['MAJOR', 'CRITICAL']);
    });

    it('should set SonarSource security filter', () => {
      builder.withSonarSourceSecurity(['sql-injection', 'xss']);
      expect(builder['params'].sonarsourceSecurity).toEqual(['sql-injection', 'xss']);
    });

    it('should set statuses filter', () => {
      builder.withStatuses(['READY', 'DEPRECATED']);
      expect(builder['params'].statuses).toEqual(['READY', 'DEPRECATED']);
    });

    it('should set tags filter', () => {
      builder.withTags(['security', 'java8']);
      expect(builder['params'].tags).toEqual(['security', 'java8']);
    });

    it('should set template key filter', () => {
      builder.withTemplateKey('java:S001');
      expect(builder['params'].template_key).toBe('java:S001');
    });

    it('should set types filter', () => {
      builder.withTypes(['BUG', 'VULNERABILITY']);
      expect(builder['params'].types).toEqual(['BUG', 'VULNERABILITY']);
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const result = builder
        .withLanguages(['java'])
        .withSeverities(['MAJOR'])
        .withTypes(['BUG'])
        .withTags(['security'])
        .inOrganization('my-org')
        .pageSize(50);

      expect(result).toBe(builder);
      expect(builder['params']).toMatchObject({
        languages: ['java'],
        severities: ['MAJOR'],
        types: ['BUG'],
        tags: ['security'],
        organization: 'my-org',
        ps: 50,
      });
    });
  });

  describe('execute', () => {
    it('should call executor with params', async () => {
      builder.withLanguages(['java']).withSeverities(['CRITICAL']).pageSize(50);

      await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        languages: ['java'],
        severities: ['CRITICAL'],
        ps: 50,
      });
    });
  });

  describe('pagination', () => {
    it('should return items from response', () => {
      const response: SearchRulesResponse = {
        total: 2,
        p: 1,
        ps: 100,
        rules: [
          {
            key: 'rule1',
            repo: 'java',
            name: 'Rule 1',
            severity: 'MAJOR',
            status: 'READY',
            type: 'BUG',
          },
          {
            key: 'rule2',
            repo: 'java',
            name: 'Rule 2',
            severity: 'CRITICAL',
            status: 'READY',
            type: 'VULNERABILITY',
          },
        ],
      };

      const items = builder['getItems'](response);
      expect(items).toEqual(response.rules);
    });

    it('should support async iteration', async () => {
      const mockResponses: SearchRulesResponse[] = [
        {
          total: 150,
          p: 1,
          ps: 100,
          rules: Array(100)
            .fill(null)
            .map((_, i) => ({
              key: `rule${String(i)}`,
              repo: 'java',
              name: `Rule ${String(i)}`,
              severity: 'MAJOR' as const,
              status: 'READY' as const,
              type: 'BUG' as const,
            })),
          paging: {
            pageIndex: 1,
            pageSize: 100,
            total: 150,
          },
        },
        {
          total: 150,
          p: 2,
          ps: 100,
          rules: Array(50)
            .fill(null)
            .map((_, i) => ({
              key: `rule${String(100 + i)}`,
              repo: 'java',
              name: `Rule ${String(100 + i)}`,
              severity: 'MAJOR' as const,
              status: 'READY' as const,
              type: 'BUG' as const,
            })),
          paging: {
            pageIndex: 2,
            pageSize: 100,
            total: 150,
          },
        },
      ];

      mockExecutor.mockResolvedValueOnce(mockResponses[0]).mockResolvedValueOnce(mockResponses[1]);

      const allRules = [];
      for await (const rule of builder.all()) {
        allRules.push(rule);
      }

      expect(allRules).toHaveLength(150);
      expect(mockExecutor).toHaveBeenCalledTimes(2);
    });
  });
});
