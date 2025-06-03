import { CreateCustomRuleV2Builder, AdvancedCustomRuleBuilder } from '../builders';
import type { CreateCustomRuleV2Request, CreateCustomRuleV2Response } from '../types';

describe('CreateCustomRuleV2Builder', () => {
  const mockExecutor = jest.fn<Promise<CreateCustomRuleV2Response>, [CreateCustomRuleV2Request]>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutor.mockResolvedValue({
      id: 'test-id',
      repositoryKey: 'test',
      key: 'test-key',
      name: 'Test Rule',
      status: 'READY',
      impacts: [],
    });
  });

  describe('basic builder methods', () => {
    it('should build a request with all basic fields', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('my-rule')
        .fromTemplate('javascript:S124')
        .withName('My Rule')
        .withDescription('Rule description')
        .withStatus('BETA')
        .build();

      expect(request).toEqual({
        key: 'my-rule',
        templateKey: 'javascript:S124',
        name: 'My Rule',
        markdownDescription: 'Rule description',
        status: 'BETA',
      });
    });

    it('should use withMarkdownDescription as alias for withDescription', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .fromTemplate('test:template')
        .withName('Test')
        .withMarkdownDescription('Markdown description')
        .build();

      expect(request.markdownDescription).toBe('Markdown description');
    });

    it('should default status to READY if not specified', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .fromTemplate('test:template')
        .withName('Test')
        .withDescription('Description')
        .build();

      expect(request.status).toBe('READY');
    });
  });

  describe('parameter management', () => {
    it('should add parameters individually', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .withParameter('param1', 'value1')
        .withParameter('param2', 'value2')
        .build();

      expect(request.parameters).toEqual([
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ]);
    });

    it('should set multiple parameters at once', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .withParameters([
          { key: 'param1', value: 'value1' },
          { key: 'param2', value: 'value2' },
        ])
        .build();

      expect(request.parameters).toEqual([
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ]);
    });

    it('should add parameters from map', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .withParameterMap({
          param1: 'value1',
          param2: 'value2',
        })
        .build();

      expect(request.parameters).toEqual([
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ]);
    });

    it('should clear parameters', () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const request = builder
        .withKey('test')
        .withParameter('param1', 'value1')
        .clearParameters()
        .withParameter('param2', 'value2')
        .build();

      expect(request.parameters).toEqual([{ key: 'param2', value: 'value2' }]);
    });
  });

  describe('validation', () => {
    it('should validate required fields', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      const result = await builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'key',
          message: 'Rule key is required',
          code: 'MISSING_KEY',
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'templateKey',
          message: 'Template key is required',
          code: 'MISSING_TEMPLATE',
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Rule name is required',
          code: 'MISSING_NAME',
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'markdownDescription',
          message: 'Rule description is required',
          code: 'MISSING_DESCRIPTION',
        })
      );
    });

    it('should validate key format', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('123-invalid') // Starts with number
        .fromTemplate('test:template')
        .withName('Test')
        .withDescription('Description');

      const result = await builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'key',
          message: expect.stringContaining('must start with a letter') as unknown as string,
          code: 'INVALID_KEY_FORMAT',
        })
      );
    });

    it('should validate name length', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('valid-key')
        .fromTemplate('test:template')
        .withName('a'.repeat(201)) // Too long
        .withDescription('Description');

      const result = await builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Rule name must not exceed 200 characters',
          code: 'NAME_TOO_LONG',
        })
      );
    });

    it('should warn about short descriptions', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('valid-key')
        .fromTemplate('test:template')
        .withName('Test Rule')
        .withDescription('Short'); // Less than 10 chars

      const result = await builder.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'markdownDescription',
          message: 'Rule description is very short',
          suggestion: expect.stringContaining('more detailed description') as unknown as string,
        })
      );
    });

    it('should validate parameter keys', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('valid-key')
        .fromTemplate('test:template')
        .withName('Test Rule')
        .withDescription('Valid description')
        .withParameters([
          { key: '', value: 'value' }, // Empty key
        ]);

      const result = await builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'parameters',
          message: 'Parameter key is required',
          code: 'MISSING_PARAMETER_KEY',
        })
      );
    });

    it('should warn about empty parameter values', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('valid-key')
        .fromTemplate('test:template')
        .withName('Test Rule')
        .withDescription('Valid description')
        .withParameter('param1', ''); // Empty value

      const result = await builder.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'parameters.param1',
          message: "Parameter 'param1' has no value",
          suggestion: expect.stringContaining('valid value or remove it') as unknown as string,
        })
      );
    });
  });

  describe('execute', () => {
    it('should validate before execution', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      // Missing required fields
      await expect(builder.execute()).rejects.toThrow('Invalid rule configuration');
      expect(mockExecutor).not.toHaveBeenCalled();
    });

    it('should execute with valid configuration', async () => {
      const builder = new CreateCustomRuleV2Builder(mockExecutor);

      builder
        .withKey('valid-key')
        .fromTemplate('test:template')
        .withName('Test Rule')
        .withDescription('Valid description');

      const result = await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        key: 'valid-key',
        templateKey: 'test:template',
        name: 'Test Rule',
        markdownDescription: 'Valid description',
        status: 'READY',
      });
      expect(result).toEqual({
        id: 'test-id',
        repositoryKey: 'test',
        key: 'test-key',
        name: 'Test Rule',
        status: 'READY',
        impacts: [],
      });
    });
  });
});

describe('AdvancedCustomRuleBuilder', () => {
  const mockExecutor = jest.fn<Promise<CreateCustomRuleV2Response>, [CreateCustomRuleV2Request]>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutor.mockResolvedValue({
      id: 'test-id',
      repositoryKey: 'test',
      key: 'test-key',
      name: 'Test Rule',
      status: 'READY',
      impacts: [],
    });
  });

  describe('security methods', () => {
    it('should configure security vulnerability rule', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder.withKey('security-rule').forSecurityVulnerability('HIGH').build();

      expect(request.status).toBe('READY');
      expect(request.parameters).toContainEqual({ key: 'category', value: 'SECURITY' });
    });

    it('should add security standards', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('security-rule')
        .withSecurityStandards('CWE-89', 'A03')
        .build();

      expect(request.parameters).toContainEqual({ key: 'cwe', value: 'CWE-89' });
      expect(request.parameters).toContainEqual({ key: 'owasp', value: 'A03' });
    });
  });

  describe('pattern methods', () => {
    it('should configure regex pattern', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder.withKey('regex-rule').withRegexPattern('console\\.log', 'gm').build();

      expect(request.parameters).toContainEqual({ key: 'pattern', value: 'console\\.log' });
      expect(request.parameters).toContainEqual({ key: 'flags', value: 'gm' });
    });

    it('should configure XPath pattern', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('xpath-rule')
        .withXPathPattern('//CallExpression[@name="eval"]')
        .build();

      expect(request.parameters).toContainEqual({
        key: 'xpath',
        value: '//CallExpression[@name="eval"]',
      });
    });

    it('should configure file patterns', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('file-rule')
        .withFilePattern(['**/*.test.ts', '**/*.spec.ts'], ['**/node_modules/**'])
        .build();

      expect(request.parameters).toContainEqual({
        key: 'includes',
        value: '**/*.test.ts,**/*.spec.ts',
      });
      expect(request.parameters).toContainEqual({
        key: 'excludes',
        value: '**/node_modules/**',
      });
    });
  });

  describe('rule configuration methods', () => {
    it('should set message template', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('message-rule')
        .withMessageTemplate('Found issue: {description}')
        .build();

      expect(request.parameters).toContainEqual({
        key: 'message',
        value: 'Found issue: {description}',
      });
    });

    it('should enable/disable rule', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const enabledRequest = builder.withKey('enabled-rule').setEnabled(true).build();

      expect(enabledRequest.status).toBe('READY');

      const disabledRequest = new AdvancedCustomRuleBuilder(mockExecutor)
        .withKey('disabled-rule')
        .setEnabled(false)
        .build();

      expect(disabledRequest.status).toBe('DEPRECATED');
    });

    it('should mark as beta', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder.withKey('beta-rule').markAsBeta().build();

      expect(request.status).toBe('BETA');
    });

    it('should mark as deprecated with details', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('deprecated-rule')
        .markAsDeprecated('Outdated API', 'new-rule')
        .build();

      expect(request.status).toBe('DEPRECATED');
      expect(request.parameters).toContainEqual({
        key: 'deprecationReason',
        value: 'Outdated API',
      });
      expect(request.parameters).toContainEqual({
        key: 'alternativeRule',
        value: 'new-rule',
      });
    });
  });

  describe('additional configuration methods', () => {
    it('should configure for frameworks', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('framework-rule')
        .forFrameworks(['React', 'Vue', 'Angular'])
        .build();

      expect(request.parameters).toContainEqual({
        key: 'frameworks',
        value: 'React,Vue,Angular',
      });
    });

    it('should set scope', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder.withKey('test-scope-rule').withScope('TEST').build();

      expect(request.parameters).toContainEqual({
        key: 'scope',
        value: 'TEST',
      });
    });

    it('should add tags', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder
        .withKey('tagged-rule')
        .withTags(['security', 'owasp-top10', 'cwe'])
        .build();

      expect(request.parameters).toContainEqual({
        key: 'tags',
        value: 'security,owasp-top10,cwe',
      });
    });

    it('should set remediation effort', () => {
      const builder = new AdvancedCustomRuleBuilder(mockExecutor);

      const request = builder.withKey('effort-rule').withRemediationEffort(30).build();

      expect(request.parameters).toContainEqual({
        key: 'remediationEffort',
        value: '30min',
      });
    });
  });

  describe('clone method', () => {
    it('should create independent copy', () => {
      const builder1 = new AdvancedCustomRuleBuilder(mockExecutor);

      builder1
        .withKey('original')
        .fromTemplate('test:template')
        .withName('Original')
        .withParameter('param1', 'value1');

      const builder2 = builder1.clone();

      // Modify the clone
      builder2.withKey('cloned').withParameter('param2', 'value2');

      const original = builder1.build();
      const cloned = builder2.build();

      expect(original.key).toBe('original');
      expect(cloned.key).toBe('cloned');

      expect(original.parameters).toHaveLength(1);
      expect(original.parameters).toContainEqual({ key: 'param1', value: 'value1' });

      expect(cloned.parameters).toHaveLength(2);
      expect(cloned.parameters).toContainEqual({ key: 'param1', value: 'value1' });
      expect(cloned.parameters).toContainEqual({ key: 'param2', value: 'value2' });
    });
  });
});
