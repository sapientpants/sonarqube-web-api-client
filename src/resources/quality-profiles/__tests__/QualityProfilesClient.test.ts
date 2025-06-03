import { http, HttpResponse } from 'msw';
import { QualityProfilesClient } from '../QualityProfilesClient';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertCommonHeaders,
  assertRequestBody,
  assertQueryParams,
} from '../../../test-utils/assertions';
import type {
  CompareResponse,
  CopyResponse,
  CreateResponse,
  ExportersResponse,
  ImportersResponse,
  InheritanceResponse,
  ProjectsResponse,
  RestoreResponse,
} from '../types';

describe('QualityProfilesClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: QualityProfilesClient;

  beforeEach(() => {
    client = new QualityProfilesClient(baseUrl, token);
  });

  describe('activateRule', () => {
    it('should activate a rule on a quality profile', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/activate_rule`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            rule: 'squid:S1234',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.activateRule({
          key: 'java-profile-key',
          rule: 'squid:S1234',
        })
      ).resolves.toBeUndefined();
    });

    it('should activate a rule with severity and parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/activate_rule`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            rule: 'squid:S1234',
            severity: 'CRITICAL',
            params: 'threshold=10',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.activateRule({
          key: 'java-profile-key',
          rule: 'squid:S1234',
          severity: 'CRITICAL',
          params: 'threshold=10',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('activateRules', () => {
    it('should create an ActivateRulesBuilder', () => {
      const builder = client.activateRules();
      expect(builder).toBeDefined();
      expect(typeof builder.targetProfile).toBe('function');
      expect(typeof builder.severities).toBe('function');
      expect(typeof builder.types).toBe('function');
    });

    it('should execute bulk rule activation', async () => {
      const mockResponse = {
        succeeded: 5,
        failed: 0,
      };

      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/activate_rules`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            targetKey: 'java-profile-key',
            severities: 'CRITICAL',
            types: 'BUG',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .activateRules()
        .targetProfile('java-profile-key')
        .severities('CRITICAL')
        .types('BUG')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('addProject', () => {
    it('should associate a project with a quality profile using key', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/add_project`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.addProject({
          key: 'java-profile-key',
          project: 'my-project',
        })
      ).resolves.toBeUndefined();
    });

    it('should associate a project using profile name and language', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/add_project`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            qualityProfile: 'Sonar way',
            language: 'java',
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.addProject({
          qualityProfile: 'Sonar way',
          language: 'java',
          project: 'my-project',
        })
      ).resolves.toBeUndefined();
    });

    it('should throw error when profile identification is missing', async () => {
      await expect(
        client.addProject({
          project: 'my-project',
        })
      ).rejects.toThrow('Either key or both qualityProfile and language must be provided');
    });

    it('should throw error when project identification is missing', async () => {
      await expect(
        client.addProject({
          key: 'java-profile-key',
        })
      ).rejects.toThrow('Either project or projectUuid must be provided');
    });
  });

  describe('backup', () => {
    it('should backup a quality profile by key', async () => {
      const xmlContent = '<?xml version="1.0"?><profile>...</profile>';

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/backup`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
          });
          return HttpResponse.text(xmlContent, {
            headers: { 'Content-Type': 'application/xml' },
          });
        })
      );

      const result = await client.backup({
        key: 'java-profile-key',
      });

      expect(result).toBe(xmlContent);
    });

    it('should backup using profile name and language', async () => {
      const xmlContent = '<?xml version="1.0"?><profile>...</profile>';

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/backup`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          assertQueryParams(request, {
            qualityProfile: 'Sonar way',
            language: 'java',
          });
          return HttpResponse.text(xmlContent, {
            headers: { 'Content-Type': 'application/xml' },
          });
        })
      );

      const result = await client.backup({
        qualityProfile: 'Sonar way',
        language: 'java',
      });

      expect(result).toBe(xmlContent);
    });
  });

  describe('changeParent', () => {
    it('should change the parent of a quality profile', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/change_parent`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'custom-java-profile',
            parentKey: 'company-java-base',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.changeParent({
          key: 'custom-java-profile',
          parentKey: 'company-java-base',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('changelog', () => {
    it('should create a ChangelogBuilder', () => {
      const builder = client.changelog();
      expect(builder).toBeDefined();
      expect(typeof builder.profile).toBe('function');
      expect(typeof builder.since).toBe('function');
      expect(typeof builder.to).toBe('function');
    });

    it('should execute changelog request with profile key', async () => {
      const mockResponse = {
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

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/changelog`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.changelog().profile('java-profile-key').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should execute changelog request with profile name and language', async () => {
      const mockResponse = {
        events: [
          {
            date: '2024-01-15T10:30:00+0000',
            action: 'DEACTIVATED',
            ruleKey: 'squid:S5678',
            ruleName: 'Another Rule',
          },
        ],
        paging: { pageIndex: 1, pageSize: 50, total: 1 },
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/changelog`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            qualityProfile: 'Sonar way',
            language: 'java',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.changelog().profileByName('Sonar way', 'java').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should execute changelog request with all parameters', async () => {
      const mockResponse = {
        events: [],
        paging: { pageIndex: 2, pageSize: 100, total: 150 },
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/changelog`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
            p: '2',
            ps: '100',
            since: '2024-01-01',
            to: '2024-12-31',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .changelog()
        .profile('java-profile-key')
        .page(2)
        .pageSize(100)
        .since('2024-01-01')
        .to('2024-12-31')
        .execute();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('compare', () => {
    it('should compare two quality profiles', async () => {
      const mockResponse: CompareResponse = {
        left: { key: 'old-profile', name: 'Old Profile' },
        right: { key: 'new-profile', name: 'New Profile' },
        inLeft: [],
        inRight: [],
        modified: [],
        same: [],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/compare`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            leftKey: 'old-profile',
            rightKey: 'new-profile',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.compare({
        leftKey: 'old-profile',
        rightKey: 'new-profile',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should compare two quality profiles using profile names', async () => {
      const mockResponse: CompareResponse = {
        left: { key: 'sonar-way-java', name: 'Sonar way' },
        right: { key: 'custom-java', name: 'Custom Java' },
        inLeft: [],
        inRight: [],
        modified: [],
        same: [],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/compare`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            leftQualityProfile: 'Sonar way',
            rightQualityProfile: 'Custom Java',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.compare({
        leftQualityProfile: 'Sonar way',
        rightQualityProfile: 'Custom Java',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('copy', () => {
    it('should copy a quality profile', async () => {
      const mockResponse: CopyResponse = {
        key: 'new-profile-key',
        name: 'Custom Java Profile',
        language: 'java',
        languageName: 'Java',
        isInherited: false,
      };

      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/copy`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            fromKey: 'source-profile',
            toName: 'Custom Java Profile',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.copy({
        fromKey: 'source-profile',
        toName: 'Custom Java Profile',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('should create a quality profile', async () => {
      const mockResponse: CreateResponse = {
        profile: {
          key: 'new-profile-key',
          name: 'Strict Java Rules',
          language: 'java',
          languageName: 'Java',
          isInherited: false,
          isBuiltIn: false,
          activeRuleCount: 0,
          activeDeprecatedRuleCount: 0,
          isDefault: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            name: 'Strict Java Rules',
            language: 'java',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.create({
        name: 'Strict Java Rules',
        language: 'java',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deactivateRule', () => {
    it('should deactivate a rule on a quality profile', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/deactivate_rule`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            rule: 'squid:S1234',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.deactivateRule({
          key: 'java-profile-key',
          rule: 'squid:S1234',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('deactivateRules', () => {
    it('should create a DeactivateRulesBuilder', () => {
      const builder = client.deactivateRules();
      expect(builder).toBeDefined();
      expect(typeof builder.targetProfile).toBe('function');
      expect(typeof builder.statuses).toBe('function');
    });

    it('should execute bulk rule deactivation', async () => {
      const mockResponse = {
        succeeded: 3,
        failed: 0,
      };

      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/deactivate_rules`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            targetKey: 'java-profile-key',
            statuses: 'DEPRECATED',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .deactivateRules()
        .targetProfile('java-profile-key')
        .statuses('DEPRECATED')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete a quality profile', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'obsolete-profile',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.delete({
          key: 'obsolete-profile',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('export', () => {
    it('should export a quality profile', async () => {
      const xmlContent = '<?xml version="1.0"?><profile>...</profile>';

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/export`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
          });
          return HttpResponse.text(xmlContent);
        })
      );

      const result = await client.export({
        key: 'java-profile-key',
      });

      expect(result).toBe(xmlContent);
    });

    it('should export with specific exporter', async () => {
      const configContent = 'eslint config content';

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/export`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          assertQueryParams(request, {
            key: 'js-profile-key',
            exporterKey: 'eslint',
          });
          return HttpResponse.text(configContent);
        })
      );

      const result = await client.export({
        key: 'js-profile-key',
        exporterKey: 'eslint',
      });

      expect(result).toBe(configContent);
    });

    it('should export using profile name and language', async () => {
      const xmlContent = '<?xml version="1.0"?><profile><name>Sonar way</name></profile>';

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/export`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          assertQueryParams(request, {
            qualityProfile: 'Sonar way',
            language: 'java',
          });
          return HttpResponse.text(xmlContent);
        })
      );

      const result = await client.export({
        qualityProfile: 'Sonar way',
        language: 'java',
      });

      expect(result).toBe(xmlContent);
    });
  });

  describe('exporters', () => {
    it('should list available exporters', async () => {
      const mockResponse: ExportersResponse = {
        exporters: [
          { key: 'eslint', name: 'ESLint', languages: ['js', 'ts'] },
          { key: 'checkstyle', name: 'Checkstyle', languages: ['java'] },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/exporters`, ({ request }) => {
          assertCommonHeaders(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.exporters();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('importers', () => {
    it('should list available importers', async () => {
      const mockResponse: ImportersResponse = {
        importers: [
          { key: 'eslint', name: 'ESLint', languages: ['js', 'ts'] },
          { key: 'checkstyle', name: 'Checkstyle', languages: ['java'] },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/importers`, ({ request }) => {
          assertCommonHeaders(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.importers();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('inheritance', () => {
    it('should get profile inheritance information', async () => {
      const mockResponse: InheritanceResponse = {
        profile: {
          key: 'custom-java-profile',
          name: 'Custom Java',
          language: 'java',
          languageName: 'Java',
          isInherited: true,
          isBuiltIn: false,
          activeRuleCount: 150,
          activeDeprecatedRuleCount: 5,
          isDefault: false,
          parentKey: 'company-base',
        },
        ancestors: [
          {
            key: 'company-base',
            name: 'Company Base',
            activeRuleCount: 100,
            isBuiltIn: false,
          },
        ],
        children: [],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/inheritance`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            key: 'custom-java-profile',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.inheritance({
        key: 'custom-java-profile',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should get profile inheritance information using profile name and language', async () => {
      const mockResponse: InheritanceResponse = {
        profile: {
          key: 'sonar-way-java',
          name: 'Sonar way',
          language: 'java',
          languageName: 'Java',
          isInherited: false,
          isBuiltIn: true,
          activeRuleCount: 200,
          activeDeprecatedRuleCount: 0,
          isDefault: true,
        },
        ancestors: [],
        children: [
          {
            key: 'custom-java-profile',
            name: 'Custom Java',
            activeRuleCount: 150,
            isBuiltIn: false,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/inheritance`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            qualityProfile: 'Sonar way',
            language: 'java',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.inheritance({
        qualityProfile: 'Sonar way',
        language: 'java',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('projects', () => {
    it('should create a ProjectsBuilder', () => {
      const builder = client.projects();
      expect(builder).toBeDefined();
      expect(typeof builder.profile).toBe('function');
      expect(typeof builder.query).toBe('function');
      expect(typeof builder.selected).toBe('function');
    });

    it('should execute projects request', async () => {
      const mockResponse = {
        results: [
          { id: '1', key: 'project1', name: 'Project 1', selected: true },
          { id: '2', key: 'project2', name: 'Project 2', selected: false },
        ],
        paging: { pageIndex: 1, pageSize: 50, total: 2 },
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/projects`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
            q: 'mobile',
            selected: 'deselected',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .projects()
        .profile('java-profile-key')
        .query('mobile')
        .selected('deselected')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('projectsAll', () => {
    it('should return an async iterator for all projects', async () => {
      const mockResponse: ProjectsResponse = {
        results: [
          { id: '1', key: 'project1', name: 'Project 1', selected: true },
          { id: '2', key: 'project2', name: 'Project 2', selected: false },
        ],
        paging: { pageIndex: 1, pageSize: 2, total: 2 },
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/projects`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            key: 'java-profile-key',
            p: '1',
            ps: '500',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const projects = [];
      for await (const project of client.projectsAll('java-profile-key')) {
        projects.push(project);
      }

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[1].name).toBe('Project 2');
    });
  });

  describe('removeProject', () => {
    it('should remove project association', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/remove_project`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.removeProject({
          key: 'java-profile-key',
          project: 'my-project',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('rename', () => {
    it('should rename a quality profile', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/rename`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'java-profile-key',
            name: 'Company Java Standards v2',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.rename({
          key: 'java-profile-key',
          name: 'Company Java Standards v2',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('restore', () => {
    it('should restore a quality profile from backup', async () => {
      const mockResponse: RestoreResponse = {
        profile: {
          key: 'restored-profile-key',
          name: 'Restored Profile',
          language: 'java',
          languageName: 'Java',
          isInherited: false,
          isBuiltIn: false,
          activeRuleCount: 95,
          activeDeprecatedRuleCount: 2,
          isDefault: false,
        },
        ruleSuccesses: 95,
        ruleFailures: 5,
      };

      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/restore`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.json();
          expect(body).toHaveProperty('backup');
          expect(body).toHaveProperty('organization', 'my-org');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.restore({
        backup: '<?xml version="1.0"?><profile>...</profile>',
        organization: 'my-org',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('search', () => {
    it('should create a SearchBuilder', () => {
      const builder = client.search();
      expect(builder).toBeDefined();
      expect(typeof builder.defaults).toBe('function');
      expect(typeof builder.language).toBe('function');
      expect(typeof builder.project).toBe('function');
    });

    it('should execute search request with no parameters', async () => {
      const mockResponse = {
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

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          // Check that the URL has no query parameters
          const url = new URL(request.url);
          expect(url.search).toBe('');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search().execute();
      expect(result).toEqual(mockResponse);
    });

    it('should execute search request with all parameters', async () => {
      const mockResponse = {
        profiles: [
          {
            key: 'java-default-profile',
            name: 'Java Default Profile',
            language: 'java',
            languageName: 'Java',
            isInherited: false,
            isBuiltIn: true,
            activeRuleCount: 150,
            activeDeprecatedRuleCount: 5,
            isDefault: true,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/qualityprofiles/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            defaults: 'true',
            language: 'java',
            project: 'my-project',
            qualityProfile: 'Sonar way',
            organization: 'my-org',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .search()
        .defaults(true)
        .language('java')
        .project('my-project')
        .qualityProfile('Sonar way')
        .organization('my-org')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('setDefault', () => {
    it('should set a profile as default', async () => {
      server.use(
        http.post(`${baseUrl}/api/qualityprofiles/set_default`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            key: 'strict-java-profile',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.setDefault({
          key: 'strict-java-profile',
        })
      ).resolves.toBeUndefined();
    });
  });
});
