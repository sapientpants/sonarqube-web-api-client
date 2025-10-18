// @ts-nocheck
import { SettingsClient } from '../../../../src/resources/settings/SettingsClient';
import {
  SetSettingBuilder,
  ResetSettingBuilder,
  ValuesBuilder,
} from '../../../../src/resources/settings/builders';
import { server } from '../../../../src/test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import { ValidationError } from '../../../../src/errors';
import type { ValuesResponse } from '../../../../src/resources/settings/types';

describe('Settings Builders', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: SettingsClient;

  beforeEach(() => {
    client = new SettingsClient(baseUrl, token);
  });

  describe('SetSettingBuilder', () => {
    let builder: SetSettingBuilder;

    beforeEach(() => {
      builder = client.set();
    });

    describe('fluent interface', () => {
      it('should build setting with single value', () => {
        const result = builder
          .key('sonar.links.scm')
          .value('git@github.com:SonarSource/sonarqube.git');

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });

      it('should build setting with multiple values', () => {
        const result = builder.key('sonar.inclusions').values(['src/**', 'lib/**']);

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });

      it('should build setting with field values', () => {
        const result = builder.key('sonar.issue.ignore.multicriteria').fieldValues([
          { ruleKey: 'java:S1135', resourceKey: '**/test/**' },
          { ruleKey: 'java:S2589', resourceKey: '**/generated/**' },
        ]);

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });

      it('should allow adding values incrementally', () => {
        const result = builder.key('sonar.inclusions').addValue('src/**').addValue('lib/**');

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });

      it('should allow adding field values incrementally', () => {
        const result = builder
          .key('sonar.issue.ignore.multicriteria')
          .addFieldValue({ ruleKey: 'java:S1135', resourceKey: '**/test/**' })
          .addFieldValue({ ruleKey: 'java:S2589', resourceKey: '**/generated/**' });

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });

      it('should build with optional parameters', () => {
        const result = builder
          .key('sonar.coverage.exclusions')
          .value('**/test/**')
          .component('my_project')
          .organization('my-org');

        expect(result).toBeInstanceOf(SetSettingBuilder);
      });
    });

    describe('validation', () => {
      it('should require key parameter', async () => {
        await expect(builder.value('test').execute()).rejects.toThrow(ValidationError);
      });

      it('should require at least one value type', async () => {
        await expect(builder.key('test.key').execute()).rejects.toThrow(ValidationError);
      });

      it('should not allow multiple value types', async () => {
        await expect(
          builder.key('test.key').value('single').values(['multiple']).execute(),
        ).rejects.toThrow(ValidationError);

        await expect(
          builder
            .key('test.key')
            .value('single')
            .fieldValues([{ key: 'value' }])
            .execute(),
        ).rejects.toThrow(ValidationError);

        await expect(
          builder
            .key('test.key')
            .values(['multiple'])
            .fieldValues([{ key: 'value' }])
            .execute(),
        ).rejects.toThrow(ValidationError);
      });

      it('should accept valid parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/set`, () => {
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await expect(builder.key('test.key').value('test').execute()).resolves.toBeUndefined();
      });
    });

    describe('execute', () => {
      it('should send correct request for single value', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('key')).toBe('sonar.links.scm');
            expect(params.get('value')).toBe('git@github.com:SonarSource/sonarqube.git');
            expect(params.has('values')).toBe(false);
            expect(params.has('fieldValues')).toBe(false);
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .key('sonar.links.scm')
          .value('git@github.com:SonarSource/sonarqube.git')
          .execute();
      });

      it('should send correct request for multiple values', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('key')).toBe('sonar.inclusions');
            expect(params.getAll('values')).toEqual(['src/**', 'lib/**', 'app/**']);
            expect(params.has('value')).toBe(false);
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .key('sonar.inclusions')
          .values(['src/**', 'lib/**'])
          .addValue('app/**')
          .execute();
      });

      it('should send correct request for field values', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('key')).toBe('sonar.issue.ignore.multicriteria');
            const fieldValues = params
              .getAll('fieldValues')
              .map((v) => JSON.parse(v) as Record<string, string>);
            expect(fieldValues).toEqual([
              { ruleKey: 'java:S1135', resourceKey: '**/test/**' },
              { ruleKey: 'java:S2589', resourceKey: '**/generated/**' },
            ]);
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .key('sonar.issue.ignore.multicriteria')
          .addFieldValue({ ruleKey: 'java:S1135', resourceKey: '**/test/**' })
          .addFieldValue({ ruleKey: 'java:S2589', resourceKey: '**/generated/**' })
          .execute();
      });

      it('should include optional parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('key')).toBe('sonar.coverage.exclusions');
            expect(params.get('value')).toBe('**/test/**');
            expect(params.get('component')).toBe('my_project');
            expect(params.get('organization')).toBe('my-org');
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .key('sonar.coverage.exclusions')
          .value('**/test/**')
          .component('my_project')
          .organization('my-org')
          .execute();
      });
    });
  });

  describe('ResetSettingBuilder', () => {
    let builder: ResetSettingBuilder;

    beforeEach(() => {
      builder = client.reset();
    });

    describe('fluent interface', () => {
      it('should build with single key', () => {
        const result = builder.keys(['sonar.links.scm']);

        expect(result).toBeInstanceOf(ResetSettingBuilder);
      });

      it('should build with multiple keys', () => {
        const result = builder.keys(['sonar.links.scm', 'sonar.debt.hoursInDay']);

        expect(result).toBeInstanceOf(ResetSettingBuilder);
      });

      it('should allow adding keys incrementally', () => {
        const result = builder.addKey('sonar.links.scm').addKey('sonar.debt.hoursInDay');

        expect(result).toBeInstanceOf(ResetSettingBuilder);
      });

      it('should build with optional parameters', () => {
        const result = builder
          .keys(['sonar.coverage.exclusions'])
          .component('my_project')
          .branch('feature/my_branch')
          .pullRequest('123')
          .organization('my-org');

        expect(result).toBeInstanceOf(ResetSettingBuilder);
      });
    });

    describe('validation', () => {
      it('should require at least one key', async () => {
        await expect(builder.execute()).rejects.toThrow(ValidationError);
      });

      it('should accept valid parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/reset`, () => {
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await expect(builder.keys(['test.key']).execute()).resolves.toBeUndefined();
      });
    });

    describe('execute', () => {
      it('should send correct request for single key', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('keys')).toBe('sonar.links.scm');
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder.keys(['sonar.links.scm']).execute();
      });

      it('should send correct request for multiple keys', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('keys')).toBe(
              'sonar.links.scm,sonar.debt.hoursInDay,sonar.inclusions',
            );
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .keys(['sonar.links.scm', 'sonar.debt.hoursInDay'])
          .addKey('sonar.inclusions')
          .execute();
      });

      it('should include optional parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
            const body = await request.text();
            const params = new URLSearchParams(body);
            expect(params.get('keys')).toBe('sonar.coverage.exclusions');
            expect(params.get('component')).toBe('my_project');
            expect(params.get('branch')).toBe('feature/my_branch');
            expect(params.get('pullRequest')).toBe('123');
            expect(params.get('organization')).toBe('my-org');
            return new HttpResponse(null, { status: 204 });
          }),
        );

        await builder
          .keys(['sonar.coverage.exclusions'])
          .component('my_project')
          .branch('feature/my_branch')
          .pullRequest('123')
          .organization('my-org')
          .execute();
      });
    });
  });

  describe('ValuesBuilder', () => {
    let builder: ValuesBuilder;

    beforeEach(() => {
      builder = client.values();
    });

    describe('fluent interface', () => {
      it('should build without parameters', () => {
        const result = builder;

        expect(result).toBeInstanceOf(ValuesBuilder);
      });

      it('should build with keys', () => {
        const result = builder.keys(['sonar.test.inclusions', 'sonar.exclusions']);

        expect(result).toBeInstanceOf(ValuesBuilder);
      });

      it('should allow adding keys incrementally', () => {
        const result = builder.addKey('sonar.test.inclusions').addKey('sonar.exclusions');

        expect(result).toBeInstanceOf(ValuesBuilder);
      });

      it('should build with component', () => {
        const result = builder.component('my_project');

        expect(result).toBeInstanceOf(ValuesBuilder);
      });

      it('should build with organization', () => {
        const result = builder.organization('my-org');

        expect(result).toBeInstanceOf(ValuesBuilder);
      });
    });

    describe('validation', () => {
      it('should not allow both component and organization', async () => {
        await expect(
          builder.component('my_project').organization('my-org').execute(),
        ).rejects.toThrow(ValidationError);
      });

      it('should accept valid parameters', async () => {
        const mockResponse: ValuesResponse = {
          settings: [],
        };

        server.use(
          http.get(`${baseUrl}/api/settings/values`, () => {
            return HttpResponse.json(mockResponse);
          }),
        );

        await expect(builder.execute()).resolves.toBeDefined();

        // Create new builders for each test to avoid state pollution
        const builderWithComponent = client.values();
        await expect(builderWithComponent.component('my_project').execute()).resolves.toBeDefined();

        const builderWithOrg = client.values();
        await expect(builderWithOrg.organization('my-org').execute()).resolves.toBeDefined();
      });
    });

    describe('execute', () => {
      it('should send correct request without parameters', async () => {
        const mockResponse: ValuesResponse = {
          settings: [
            {
              key: 'sonar.links.scm',
              value: 'git@github.com:SonarSource/sonarqube.git',
            },
          ],
        };

        server.use(
          http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.entries().next().done).toBe(true); // No params
            return HttpResponse.json(mockResponse);
          }),
        );

        const result = await builder.execute();
        expect(result.settings).toHaveLength(1);
      });

      it('should send correct request with keys', async () => {
        const mockResponse: ValuesResponse = {
          settings: [
            {
              key: 'sonar.test.inclusions',
              value: '**/test/**',
            },
            {
              key: 'sonar.exclusions',
              values: ['**/vendor/**'],
            },
          ],
        };

        server.use(
          http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('keys')).toBe(
              'sonar.test.inclusions,sonar.exclusions,sonar.links.scm',
            );
            return HttpResponse.json(mockResponse);
          }),
        );

        await builder
          .keys(['sonar.test.inclusions', 'sonar.exclusions'])
          .addKey('sonar.links.scm')
          .execute();
      });

      it('should send correct request with component', async () => {
        const mockResponse: ValuesResponse = {
          settings: [],
        };

        server.use(
          http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('component')).toBe('my_project');
            expect(url.searchParams.has('organization')).toBe(false);
            return HttpResponse.json(mockResponse);
          }),
        );

        await builder.component('my_project').execute();
      });

      it('should send correct request with organization', async () => {
        const mockResponse: ValuesResponse = {
          settings: [],
        };

        server.use(
          http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('organization')).toBe('my-org');
            expect(url.searchParams.has('component')).toBe(false);
            return HttpResponse.json(mockResponse);
          }),
        );

        await builder.organization('my-org').execute();
      });
    });
  });
});
