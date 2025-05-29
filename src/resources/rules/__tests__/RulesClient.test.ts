import { RulesClient } from '../RulesClient';
import { SearchRulesBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';

describe('RulesClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: RulesClient;

  beforeEach(() => {
    client = new RulesClient(baseUrl, token);
  });

  describe('listRepositories', () => {
    it('should list all rule repositories', async () => {
      const result = await client.listRepositories();

      expect(result.repositories).toHaveLength(4);
      expect(result.repositories[0]).toEqual({
        key: 'java',
        name: 'SonarQube',
        language: 'java',
      });
    });

    it('should filter repositories by language', async () => {
      const result = await client.listRepositories({ language: 'java' });

      expect(result.repositories).toHaveLength(2);
      expect(result.repositories[0].language).toBe('java');
      expect(result.repositories[1].language).toBe('java');
    });

    it('should filter repositories by query', async () => {
      const result = await client.listRepositories({ q: 'squid' });

      expect(result.repositories).toHaveLength(1);
      expect(result.repositories[0].key).toContain('squid');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get('*/api/rules/repositories', () => {
          return HttpResponse.json({ repositories: [] });
        })
      );

      const result = await client.listRepositories({ language: 'unknown' });
      expect(result.repositories).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('should return a SearchRulesBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchRulesBuilder);
    });
  });

  describe('show', () => {
    it('should get detailed rule information', async () => {
      const result = await client.show({
        key: 'java:S1234',
        organization: 'my-org',
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.rule.name).toBe('Rule Name');
      expect(result.rule.severity).toBe('MAJOR');
    });

    it('should include activations when requested', async () => {
      const result = await client.show({
        key: 'java:S1234',
        organization: 'my-org',
        actives: true,
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.actives).toBeDefined();
      expect(result.actives).toHaveLength(1);
    });

    it('should throw on not found error', async () => {
      server.use(
        http.get('*/api/rules/show', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Rule not found' }] }), {
            status: 404,
          });
        })
      );

      await expect(
        client.show({
          key: 'unknown:rule',
          organization: 'my-org',
        })
      ).rejects.toThrow('Not Found');
    });
  });

  describe('listTags', () => {
    it('should list all rule tags', async () => {
      const result = await client.listTags({
        organization: 'my-org',
      });

      expect(result.tags).toEqual(['security', 'java8', 'performance', 'sql', 'injection']);
    });

    it('should filter tags by query', async () => {
      const result = await client.listTags({
        organization: 'my-org',
        q: 'sec',
      });

      expect(result.tags).toEqual(['security']);
    });

    it('should respect page size parameter', async () => {
      const result = await client.listTags({
        organization: 'my-org',
        ps: 2,
      });

      expect(result.tags).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update a rule successfully', async () => {
      const result = await client.update({
        key: 'java:S1234',
        organization: 'my-org',
        name: 'Updated Rule Name',
        severity: 'CRITICAL',
        tags: 'security,java8',
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.rule.name).toBe('Updated Rule Name');
      expect(result.rule.severity).toBe('CRITICAL');
      expect(result.rule.tags).toEqual(['security', 'java8']);
    });

    it('should update rule description', async () => {
      const result = await client.update({
        key: 'java:S1234',
        organization: 'my-org',
        markdown_description: 'Updated description',
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.rule.mdDesc).toBe('Updated description');
    });

    it('should update rule note', async () => {
      const result = await client.update({
        key: 'java:S1234',
        organization: 'my-org',
        markdown_note: 'This is a note',
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.rule.mdNote).toBe('This is a note');
    });

    it('should update remediation function', async () => {
      const result = await client.update({
        key: 'java:S1234',
        organization: 'my-org',
        remediation_fn_type: 'LINEAR',
        remediation_fn_base_effort: '5min',
        remediation_fy_gap_multiplier: '10min',
      });

      expect(result.rule.key).toBe('java:S1234');
      expect(result.rule.remFn).toBe('LINEAR');
      expect(result.rule.remFnBaseEffort).toBe('5min');
      expect(result.rule.remFnGapMultiplier).toBe('10min');
    });

    it('should throw on authorization error', async () => {
      server.use(
        http.post('*/api/rules/update', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Insufficient privileges' }] }),
            { status: 403 }
          );
        })
      );

      await expect(
        client.update({
          key: 'java:S1234',
          organization: 'my-org',
          name: 'Will fail',
        })
      ).rejects.toThrow('Forbidden');
    });
  });
});
