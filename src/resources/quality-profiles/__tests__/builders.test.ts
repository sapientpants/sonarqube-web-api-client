import {
  ActivateRulesBuilder,
  ChangelogBuilder,
  DeactivateRulesBuilder,
  ProjectsBuilder,
  SearchBuilder,
} from '../builders';
import type {
  ActivateRulesResponse,
  ChangelogResponse,
  ProjectsResponse,
  SearchResponse,
} from '../types';

describe('Quality Profiles Builders', () => {
  describe('ActivateRulesBuilder', () => {
    it('should build activate rules request with required parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        succeeded: 10,
        failed: 0,
      } as ActivateRulesResponse);

      const builder = new ActivateRulesBuilder(mockExecutor);
      await builder.targetProfile('java-profile-key').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        targetKey: 'java-profile-key',
      });
    });

    it('should build request with all parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        succeeded: 5,
        failed: 0,
      } as ActivateRulesResponse);

      const builder = new ActivateRulesBuilder(mockExecutor);
      await builder
        .targetProfile('java-profile-key')
        .severities('CRITICAL,MAJOR')
        .types('BUG,VULNERABILITY')
        .repositories('squid,pmd')
        .targetSeverity('BLOCKER')
        .languages('java')
        .tags('security')
        .activation(true)
        .availableSince('2024-01-01')
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        targetKey: 'java-profile-key',
        severities: 'CRITICAL,MAJOR',
        types: 'BUG,VULNERABILITY',
        repositories: 'squid,pmd',
        targetSeverity: 'BLOCKER',
        languages: 'java',
        tags: 'security',
        activation: true,
        available_since: '2024-01-01',
      });
    });

    it('should throw error when target profile is not provided', async () => {
      const mockExecutor = jest.fn();
      const builder = new ActivateRulesBuilder(mockExecutor);

      await expect(builder.execute()).rejects.toThrow('Target profile key is required');
      expect(mockExecutor).not.toHaveBeenCalled();
    });
  });

  describe('DeactivateRulesBuilder', () => {
    it('should extend ActivateRulesBuilder and work correctly', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        succeeded: 3,
        failed: 0,
      } as ActivateRulesResponse);

      const builder = new DeactivateRulesBuilder(mockExecutor);
      await builder.targetProfile('java-profile-key').statuses('DEPRECATED').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        targetKey: 'java-profile-key',
        statuses: 'DEPRECATED',
      });
    });
  });

  describe('ChangelogBuilder', () => {
    const mockResponse: ChangelogResponse = {
      events: [
        {
          date: '2024-01-15T10:30:00+0000',
          action: 'ACTIVATED',
          ruleKey: 'squid:S1234',
          ruleName: 'Rule Name',
        },
      ],
      paging: { pageIndex: 1, pageSize: 50, total: 1 },
    };

    it('should build changelog request with profile key', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new ChangelogBuilder(mockExecutor);

      await builder.profile('java-profile-key').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        key: 'java-profile-key',
      });
    });

    it('should build request with profile name and language', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new ChangelogBuilder(mockExecutor);

      await builder.profileByName('Sonar way', 'java').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        qualityProfile: 'Sonar way',
        language: 'java',
      });
    });

    it('should support date filters and pagination', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new ChangelogBuilder(mockExecutor);

      await builder
        .profile('java-profile-key')
        .since('2024-01-01')
        .to('2024-12-31')
        .page(2)
        .pageSize(100)
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        key: 'java-profile-key',
        since: '2024-01-01',
        to: '2024-12-31',
        p: 2,
        ps: 100,
      });
    });

    it('should throw error when profile identification is missing', async () => {
      const mockExecutor = jest.fn();
      const builder = new ChangelogBuilder(mockExecutor);

      await expect(builder.execute()).rejects.toThrow(
        'Either key or both qualityProfile and language must be provided'
      );
    });

    it('should support async iteration', async () => {
      const mockExecutor = jest
        .fn()
        .mockResolvedValueOnce({
          events: [
            { date: '2024-01-01', action: 'ACTIVATED', ruleKey: 'rule1', ruleName: 'Rule 1' },
            { date: '2024-01-02', action: 'DEACTIVATED', ruleKey: 'rule2', ruleName: 'Rule 2' },
          ],
          paging: { pageIndex: 1, pageSize: 2, total: 3 },
        })
        .mockResolvedValueOnce({
          events: [{ date: '2024-01-03', action: 'UPDATED', ruleKey: 'rule3', ruleName: 'Rule 3' }],
          paging: { pageIndex: 2, pageSize: 2, total: 3 },
        });

      const builder = new ChangelogBuilder(mockExecutor);
      const items = [];

      for await (const item of builder.profile('java-profile-key').all()) {
        items.push(item);
      }

      expect(items).toHaveLength(3);
      expect(items[0].ruleKey).toBe('rule1');
      expect(items[1].ruleKey).toBe('rule2');
      expect(items[2].ruleKey).toBe('rule3');
    });
  });

  describe('ProjectsBuilder', () => {
    const mockResponse: ProjectsResponse = {
      results: [{ id: '1', key: 'project1', name: 'Project 1', selected: true }],
      paging: { pageIndex: 1, pageSize: 50, total: 1 },
    };

    it('should build projects request with required profile key', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new ProjectsBuilder(mockExecutor);

      await builder.profile('java-profile-key').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        key: 'java-profile-key',
      });
    });

    it('should support query and selection filter', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new ProjectsBuilder(mockExecutor);

      await builder.profile('java-profile-key').query('mobile').selected('deselected').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        key: 'java-profile-key',
        q: 'mobile',
        selected: 'deselected',
      });
    });

    it('should throw error when profile key is not provided', async () => {
      const mockExecutor = jest.fn();
      const builder = new ProjectsBuilder(mockExecutor);

      await expect(builder.execute()).rejects.toThrow('Profile key is required');
    });
  });

  describe('SearchBuilder', () => {
    const mockResponse: SearchResponse = {
      profiles: [
        {
          key: 'java-profile',
          name: 'Java Profile',
          language: 'java',
          languageName: 'Java',
          isInherited: false,
          isBuiltIn: false,
          activeRuleCount: 100,
          activeDeprecatedRuleCount: 0,
          isDefault: true,
        },
      ],
    };

    it('should build search request with no parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new SearchBuilder(mockExecutor);

      await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({});
    });

    it('should build request with all parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue(mockResponse);
      const builder = new SearchBuilder(mockExecutor);

      await builder
        .defaults(true)
        .language('java')
        .project('my-project')
        .qualityProfile('Sonar way')
        .organization('my-org')
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        defaults: true,
        language: 'java',
        project: 'my-project',
        qualityProfile: 'Sonar way',
        organization: 'my-org',
      });
    });
  });
});
