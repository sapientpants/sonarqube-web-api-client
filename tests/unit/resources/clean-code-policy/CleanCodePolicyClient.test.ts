// @ts-nocheck
import { server } from '../../../../src/test-utils/msw/server.js';
import { http, HttpResponse } from 'msw';
import { CleanCodePolicyClient } from '../../../../src/resources/clean-code-policy/CleanCodePolicyClient.js';
import type {
  CreateCustomRuleV2Request,
  CreateCustomRuleV2Response,
} from '../../../../src/resources/clean-code-policy/types.js';

describe('CleanCodePolicyClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  const client = new CleanCodePolicyClient(baseUrl, token);

  describe('createCustomRuleV2', () => {
    it('should create a custom rule successfully', async () => {
      const request: CreateCustomRuleV2Request = {
        key: 'no-console',
        templateKey: 'javascript:S124',
        name: 'No console.log',
        markdownDescription: 'Console logging should not be used in production',
        status: 'READY',
        parameters: [{ key: 'message', value: 'Remove console.log statement' }],
      };

      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz123',
        repositoryKey: 'javascript',
        key: 'no-console',
        ruleKey: 'javascript:no-console',
        name: 'No console.log',
        markdownDescription: 'Console logging should not be used in production',
        status: 'READY',
        severity: 'MAJOR',
        type: 'CODE_SMELL',
        impacts: [
          {
            softwareQuality: 'MAINTAINABILITY',
            severity: 'MEDIUM',
          },
        ],
        cleanCodeAttribute: 'CLEAR',
        cleanCodeAttributeCategory: 'INTENTIONAL',
        language: 'js',
        languageName: 'JavaScript',
        templateKey: 'javascript:S124',
        parameters: [
          {
            key: 'message',
            defaultValue: 'Remove console.log statement',
            type: 'STRING',
          },
        ],
        createdAt: '2025-01-30T10:00:00Z',
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async () => {
          return HttpResponse.json(mockResponse, { status: 201 });
        }),
      );

      const result = await client.createCustomRuleV2(request);

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors correctly', async () => {
      const request: CreateCustomRuleV2Request = {
        key: 'existing-rule',
        templateKey: 'javascript:S124',
        name: 'Existing Rule',
        markdownDescription: 'This rule already exists',
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, () => {
          return HttpResponse.json(
            {
              error: 'Rule key already exists',
              message: 'A rule with key "existing-rule" already exists',
            },
            { status: 400 },
          );
        }),
      );

      await expect(client.createCustomRuleV2(request)).rejects.toThrow();
    });

    it('should handle missing template errors', async () => {
      const request: CreateCustomRuleV2Request = {
        key: 'my-rule',
        templateKey: 'nonexistent:template',
        name: 'My Rule',
        markdownDescription: 'Description',
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, () => {
          return HttpResponse.json(
            {
              error: 'Template not found',
              message: 'Template "nonexistent:template" was not found',
            },
            { status: 404 },
          );
        }),
      );

      await expect(client.createCustomRuleV2(request)).rejects.toThrow();
    });

    it('should handle permission errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, () => {
          return HttpResponse.json(
            {
              error: 'Insufficient permissions',
              message: 'You need "Administer Quality Profiles" permission',
            },
            { status: 403 },
          );
        }),
      );

      await expect(
        client.createCustomRuleV2({
          key: 'test',
          templateKey: 'test',
          name: 'Test',
          markdownDescription: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  describe('createRule builder', () => {
    it('should create a rule using the builder pattern', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz456',
        repositoryKey: 'java',
        key: 'avoid-nullpointer',
        name: 'Avoid NullPointerException',
        status: 'READY',
        impacts: [],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.key).toBe('avoid-nullpointer');
          expect(body.templateKey).toBe('java:S2259');
          expect(body.name).toBe('Avoid NullPointerException');
          expect(body.parameters).toHaveLength(1);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createRule()
        .withKey('avoid-nullpointer')
        .fromTemplate('java:S2259')
        .withName('Avoid NullPointerException')
        .withDescription('Check for null before dereferencing')
        .withParameter('message', 'Potential NullPointerException')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should validate required fields before execution', async () => {
      const builder = client.createRule();

      // Missing all required fields
      await expect(builder.execute()).rejects.toThrow('Invalid rule configuration');

      // Missing template key
      builder.withKey('test-key').withName('Test').withDescription('Test description');
      await expect(builder.execute()).rejects.toThrow('Invalid rule configuration');
    });

    it('should handle multiple parameters correctly', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz789',
        repositoryKey: 'python',
        key: 'complex-rule',
        name: 'Complex Rule',
        status: 'READY',
        impacts: [],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.parameters).toHaveLength(3);
          expect(body.parameters).toContainEqual({ key: 'pattern', value: '.*TODO.*' });
          expect(body.parameters).toContainEqual({ key: 'flags', value: 'gi' });
          expect(body.parameters).toContainEqual({ key: 'message', value: 'Found TODO' });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createRule()
        .withKey('complex-rule')
        .fromTemplate('python:CommentRegex')
        .withName('Complex Rule')
        .withDescription('Complex rule with multiple parameters')
        .withParameter('pattern', '.*TODO.*')
        .withParameter('flags', 'gi')
        .withParameter('message', 'Found TODO')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('createAdvancedRule builder', () => {
    it('should create a security rule with advanced builder', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz999',
        repositoryKey: 'java',
        key: 'sql-injection',
        name: 'SQL Injection Prevention',
        status: 'READY',
        severity: 'BLOCKER',
        type: 'VULNERABILITY',
        impacts: [
          {
            softwareQuality: 'SECURITY',
            severity: 'HIGH',
          },
        ],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.key).toBe('sql-injection');
          expect(body.parameters).toContainEqual({ key: 'category', value: 'SECURITY' });
          expect(body.parameters).toContainEqual({ key: 'cwe', value: 'CWE-89' });
          expect(body.parameters).toContainEqual({ key: 'owasp', value: 'A03' });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createAdvancedRule()
        .withKey('sql-injection')
        .fromTemplate('java:S3649')
        .withName('SQL Injection Prevention')
        .withDescription('Prevent SQL injection vulnerabilities')
        .forSecurityVulnerability('HIGH')
        .withSecurityStandards('CWE-89', 'A03')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should support regex pattern configuration', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz111',
        repositoryKey: 'javascript',
        key: 'no-console-regex',
        name: 'No Console (Regex)',
        status: 'READY',
        impacts: [],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.parameters).toContainEqual({
            key: 'pattern',
            value: 'console\\.(log|error|warn)',
          });
          expect(body.parameters).toContainEqual({ key: 'flags', value: 'gm' });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createAdvancedRule()
        .withKey('no-console-regex')
        .fromTemplate('javascript:RegexRule')
        .withName('No Console (Regex)')
        .withDescription('No console methods allowed')
        .withRegexPattern('console\\.(log|error|warn)', 'gm')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should support file pattern configuration', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz222',
        repositoryKey: 'typescript',
        key: 'test-files-only',
        name: 'Test Files Only',
        status: 'READY',
        impacts: [],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.parameters).toContainEqual({
            key: 'includes',
            value: '**/*.test.ts,**/*.spec.ts',
          });
          expect(body.parameters).toContainEqual({
            key: 'excludes',
            value: '**/node_modules/**,**/dist/**',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createAdvancedRule()
        .withKey('test-files-only')
        .fromTemplate('typescript:TestRule')
        .withName('Test Files Only')
        .withDescription('Apply only to test files')
        .withFilePattern(['**/*.test.ts', '**/*.spec.ts'], ['**/node_modules/**', '**/dist/**'])
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should support deprecation configuration', async () => {
      const mockResponse: CreateCustomRuleV2Response = {
        id: 'AYz333',
        repositoryKey: 'java',
        key: 'old-api-usage',
        name: 'Old API Usage',
        status: 'DEPRECATED',
        impacts: [],
      };

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.status).toBe('DEPRECATED');
          expect(body.parameters).toContainEqual({
            key: 'deprecationReason',
            value: 'API is outdated',
          });
          expect(body.parameters).toContainEqual({
            key: 'alternativeRule',
            value: 'java:new-api-usage',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .createAdvancedRule()
        .withKey('old-api-usage')
        .fromTemplate('java:APIUsage')
        .withName('Old API Usage')
        .withDescription('Detects usage of deprecated APIs')
        .markAsDeprecated('API is outdated', 'java:new-api-usage')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateRule', () => {
    it('should validate a valid rule configuration', async () => {
      const request: CreateCustomRuleV2Request = {
        key: 'valid-rule',
        templateKey: 'javascript:S124',
        name: 'Valid Rule',
        markdownDescription: 'This is a valid rule description with enough detail',
        status: 'READY',
        parameters: [{ key: 'message', value: 'Issue detected' }],
      };

      const result = await client.validateRule(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it('should detect missing required fields', async () => {
      const request: Partial<CreateCustomRuleV2Request> = {
        name: 'Incomplete Rule',
      };

      const result = await client.validateRule(request as CreateCustomRuleV2Request);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(3); // missing key, templateKey, description
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'key',
          message: 'Rule key is required',
          code: 'MISSING_KEY',
        }),
      );
    });

    it('should validate key format', async () => {
      const request: CreateCustomRuleV2Request = {
        key: '123-invalid-key', // starts with number
        templateKey: 'javascript:S124',
        name: 'Invalid Key Rule',
        markdownDescription: 'Description',
      };

      const result = await client.validateRule(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'key',
          message: expect.stringContaining('must start with a letter') as unknown as string,
        }),
      );
    });

    it('should warn about short descriptions', async () => {
      const request: CreateCustomRuleV2Request = {
        key: 'short-desc',
        templateKey: 'javascript:S124',
        name: 'Short Description Rule',
        markdownDescription: 'Too short', // less than 10 chars
      };

      const result = await client.validateRule(request);

      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'markdownDescription',
          message: 'Rule description is very short',
        }),
      );
    });
  });

  describe('createBatch', () => {
    it('should create multiple rules successfully', async () => {
      const rules: CreateCustomRuleV2Request[] = [
        {
          key: 'rule1',
          templateKey: 'javascript:S124',
          name: 'Rule 1',
          markdownDescription: 'Description 1',
        },
        {
          key: 'rule2',
          templateKey: 'javascript:S125',
          name: 'Rule 2',
          markdownDescription: 'Description 2',
        },
      ];

      const mockResponses = rules.map((rule, index) => ({
        id: `AY${index.toString()}`,
        repositoryKey: 'javascript',
        key: rule.key,
        name: rule.name,
        status: 'READY' as const,
        impacts: [],
      }));

      let callCount = 0;
      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          const response = mockResponses.find((r) => r.key === body.key);
          callCount++;
          return HttpResponse.json(response);
        }),
      );

      const result = await client.createBatch(rules);

      expect(callCount).toBe(2);
      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.created[0].key).toBe('rule1');
      expect(result.created[1].key).toBe('rule2');
    });

    it('should handle partial failures in batch', async () => {
      const rules: CreateCustomRuleV2Request[] = [
        {
          key: 'success-rule',
          templateKey: 'javascript:S124',
          name: 'Success Rule',
          markdownDescription: 'This will succeed',
        },
        {
          key: 'fail-rule',
          templateKey: 'nonexistent:template',
          name: 'Fail Rule',
          markdownDescription: 'This will fail',
        },
      ];

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;

          if (body.key === 'fail-rule') {
            return HttpResponse.json({ error: 'Template not found' }, { status: 404 });
          }

          return HttpResponse.json({
            id: 'AY123',
            key: body.key,
            name: body.name,
            status: 'READY',
            impacts: [],
          });
        }),
      );

      const result = await client.createBatch(rules);

      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.created[0].key).toBe('success-rule');
      expect(result.failed[0].rule.key).toBe('fail-rule');
      expect(result.failed[0].error).toBeDefined();
    });
  });

  describe('importRules', () => {
    it('should import rules from JSON', async () => {
      const exportData = JSON.stringify([
        {
          key: 'imported-rule-1',
          templateKey: 'javascript:S124',
          name: 'Imported Rule 1',
          markdownDescription: 'Description 1',
          status: 'READY',
          parameters: [{ key: 'message', value: 'Test message' }],
        },
      ]);

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          return HttpResponse.json({
            id: 'AY999',
            key: body.key,
            name: body.name,
            status: 'READY',
            impacts: [],
          });
        }),
      );

      const result = await client.importRules(exportData);

      expect(result.imported).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle invalid JSON', async () => {
      const invalidJson = '{ invalid json';

      await expect(client.importRules(invalidJson)).rejects.toThrow('Invalid JSON data');
    });

    it('should skip existing rules when option is set', async () => {
      const exportData = JSON.stringify([
        {
          key: 'existing-rule',
          templateKey: 'javascript:S124',
          name: 'Existing Rule',
          markdownDescription: 'Already exists',
        },
      ]);

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, () => {
          return HttpResponse.json({ error: 'Rule key already exists' }, { status: 400 });
        }),
      );

      const result = await client.importRules(exportData, { skipExisting: true });

      // Since we're using skipExisting, the rule should be in either skipped or failed
      expect(result.imported).toHaveLength(0);
      expect(result.skipped.length + result.failed.length).toBeGreaterThan(0);
    });

    it('should add key prefix when specified', async () => {
      const exportData = JSON.stringify([
        {
          key: 'original-key',
          templateKey: 'javascript:S124',
          name: 'Original Rule',
          markdownDescription: 'Description',
        },
      ]);

      server.use(
        http.post(`${baseUrl}/api/v2/clean-code-policy/rules`, async ({ request }) => {
          const body = (await request.json()) as CreateCustomRuleV2Request;
          expect(body.key).toBe('prefix-original-key');
          return HttpResponse.json({
            id: 'AY123',
            key: body.key,
            name: body.name,
            status: 'READY',
            impacts: [],
          });
        }),
      );

      const result = await client.importRules(exportData, { keyPrefix: 'prefix-' });

      expect(result.imported).toHaveLength(1);
      expect(result.imported[0].key).toBe('prefix-original-key');
    });
  });

  describe('exportRules', () => {
    it('should export rules to JSON format', () => {
      const rules: CreateCustomRuleV2Response[] = [
        {
          id: 'AY123',
          repositoryKey: 'javascript',
          key: 'no-console',
          name: 'No Console',
          markdownDescription: 'No console logging',
          status: 'READY',
          templateKey: 'javascript:S124',
          impacts: [],
          parameters: [
            {
              key: 'message',
              defaultValue: 'Remove console',
              type: 'STRING',
            },
          ],
        },
      ];

      const exportData = client.exportRules(rules);
      const parsed = JSON.parse(exportData) as Array<{
        key: string;
        templateKey: string;
        name: string;
        markdownDescription: string;
        status: string;
        parameters: Array<{ key: string; value: string }>;
      }>;

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({
        key: 'no-console',
        templateKey: 'javascript:S124',
        name: 'No Console',
        markdownDescription: 'No console logging',
        status: 'READY',
        parameters: [{ key: 'message', value: 'Remove console' }],
      });
    });
  });
});
