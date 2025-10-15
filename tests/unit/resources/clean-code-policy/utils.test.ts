// @ts-nocheck
import {
  ruleKeyUtils,
  parameterUtils,
  patternBuilder,
  messageTemplateUtils,
  ruleMigrationUtils,
  cleanCodeAttributeUtils,
} from '../../../../src/resources/clean-code-policy/utils';
import type { CreateCustomRuleV2Response } from '../../../../src/resources/clean-code-policy/types';

describe('ruleKeyUtils', () => {
  describe('generateKey', () => {
    it('should generate valid keys from names', () => {
      expect(ruleKeyUtils.generateKey('No Console Log')).toBe('no-console-log');
      expect(ruleKeyUtils.generateKey('SQL Injection Detection')).toBe('sql-injection-detection');
      expect(ruleKeyUtils.generateKey('Use const/let instead of var')).toBe(
        'use-const-let-instead-of-var',
      );
    });

    it('should handle special characters', () => {
      expect(ruleKeyUtils.generateKey('No @deprecated APIs!')).toBe('no-deprecated-apis');
      expect(ruleKeyUtils.generateKey('Avoid $$ in names')).toBe('avoid-in-names');
      expect(ruleKeyUtils.generateKey('   Trim   Spaces   ')).toBe('trim-spaces');
    });

    it('should add prefix when provided', () => {
      expect(ruleKeyUtils.generateKey('Console Log', 'custom')).toBe('custom-console-log');
      expect(ruleKeyUtils.generateKey('SQL Injection', 'sec')).toBe('sec-sql-injection');
    });

    it('should ensure key starts with letter', () => {
      expect(ruleKeyUtils.generateKey('123 Numbers First')).toBe('rule-123-numbers-first');
      expect(ruleKeyUtils.generateKey('_underscore')).toBe('underscore'); // _ is removed, result starts with 'u'
      expect(ruleKeyUtils.generateKey('___')).toBe('rule-'); // All underscores removed, needs prefix
    });

    it('should truncate long keys', () => {
      const longName = `${'This is a very '.repeat(20)}long rule name`;
      const key = ruleKeyUtils.generateKey(longName);
      expect(key.length).toBeLessThanOrEqual(200);
      expect(key).not.toMatch(/-$/); // Should not end with hyphen
    });
  });

  describe('isValidKey', () => {
    it('should validate correct keys', () => {
      expect(ruleKeyUtils.isValidKey('valid-key')).toBe(true);
      expect(ruleKeyUtils.isValidKey('valid_key')).toBe(true);
      expect(ruleKeyUtils.isValidKey('validKey123')).toBe(true);
      expect(ruleKeyUtils.isValidKey('a')).toBe(true);
    });

    it('should reject invalid keys', () => {
      expect(ruleKeyUtils.isValidKey('123-invalid')).toBe(false); // starts with number
      expect(ruleKeyUtils.isValidKey('-invalid')).toBe(false); // starts with hyphen
      expect(ruleKeyUtils.isValidKey('invalid key')).toBe(false); // contains space
      expect(ruleKeyUtils.isValidKey('invalid@key')).toBe(false); // contains special char
      expect(ruleKeyUtils.isValidKey('a'.repeat(201))).toBe(false); // too long
    });
  });

  describe('extractRepositoryKey', () => {
    it('should extract repository from full key', () => {
      expect(ruleKeyUtils.extractRepositoryKey('javascript:S1234')).toBe('javascript');
      expect(ruleKeyUtils.extractRepositoryKey('java:S5678')).toBe('java');
      expect(ruleKeyUtils.extractRepositoryKey('csharpsquid:S9999')).toBe('csharpsquid');
    });

    it('should return null for keys without repository', () => {
      expect(ruleKeyUtils.extractRepositoryKey('S1234')).toBeNull();
      expect(ruleKeyUtils.extractRepositoryKey('custom-rule')).toBeNull();
    });
  });

  describe('extractRuleKey', () => {
    it('should extract rule key from full key', () => {
      expect(ruleKeyUtils.extractRuleKey('javascript:S1234')).toBe('S1234');
      expect(ruleKeyUtils.extractRuleKey('java:custom-rule')).toBe('custom-rule');
    });

    it('should return input if no repository prefix', () => {
      expect(ruleKeyUtils.extractRuleKey('S1234')).toBe('S1234');
      expect(ruleKeyUtils.extractRuleKey('custom-rule')).toBe('custom-rule');
    });
  });
});

describe('parameterUtils', () => {
  describe('createParameter', () => {
    it('should create parameter object', () => {
      expect(parameterUtils.createParameter('message', 'Error found')).toEqual({
        key: 'message',
        value: 'Error found',
      });
    });
  });

  describe('fromMap', () => {
    it('should convert map to array', () => {
      const map = {
        param1: 'value1',
        param2: 'value2',
        param3: 'value3',
      };

      const array = parameterUtils.fromMap(map);

      expect(array).toHaveLength(3);
      expect(array).toContainEqual({ key: 'param1', value: 'value1' });
      expect(array).toContainEqual({ key: 'param2', value: 'value2' });
      expect(array).toContainEqual({ key: 'param3', value: 'value3' });
    });
  });

  describe('toMap', () => {
    it('should convert array to map', () => {
      const array = [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ];

      const map = parameterUtils.toMap(array);

      expect(map).toEqual({
        param1: 'value1',
        param2: 'value2',
      });
    });
  });

  describe('isValidValue', () => {
    it('should validate integer values', () => {
      expect(parameterUtils.isValidValue('123', 'INTEGER')).toBe(true);
      expect(parameterUtils.isValidValue('-456', 'INTEGER')).toBe(true);
      expect(parameterUtils.isValidValue('12.34', 'INTEGER')).toBe(false);
      expect(parameterUtils.isValidValue('abc', 'INTEGER')).toBe(false);
    });

    it('should validate float values', () => {
      expect(parameterUtils.isValidValue('123.45', 'FLOAT')).toBe(true);
      expect(parameterUtils.isValidValue('-67.89', 'FLOAT')).toBe(true);
      expect(parameterUtils.isValidValue('100', 'FLOAT')).toBe(true); // integers are valid floats
      expect(parameterUtils.isValidValue('abc', 'FLOAT')).toBe(false);
    });

    it('should validate boolean values', () => {
      expect(parameterUtils.isValidValue('true', 'BOOLEAN')).toBe(true);
      expect(parameterUtils.isValidValue('false', 'BOOLEAN')).toBe(true);
      expect(parameterUtils.isValidValue('TRUE', 'BOOLEAN')).toBe(false); // case sensitive
      expect(parameterUtils.isValidValue('1', 'BOOLEAN')).toBe(false);
    });

    it('should accept any string for STRING/TEXT types', () => {
      expect(parameterUtils.isValidValue('any string', 'STRING')).toBe(true);
      expect(parameterUtils.isValidValue('123', 'STRING')).toBe(true);
      expect(parameterUtils.isValidValue('', 'TEXT')).toBe(true);
    });

    it('should accept any value when type is not specified', () => {
      expect(parameterUtils.isValidValue('anything')).toBe(true);
      expect(parameterUtils.isValidValue('123')).toBe(true);
    });
  });
});

describe('patternBuilder', () => {
  describe('methodCallPattern', () => {
    it('should build pattern for object.method calls', () => {
      expect(patternBuilder.methodCallPattern('console', 'log')).toBe(
        '\\bconsole\\s*\\.\\s*log\\s*\\(',
      );
      expect(patternBuilder.methodCallPattern('Math', 'random')).toBe(
        '\\bMath\\s*\\.\\s*random\\s*\\(',
      );
    });

    it('should build pattern for any method on object', () => {
      expect(patternBuilder.methodCallPattern('console')).toBe('\\bconsole\\s*\\.\\s*\\w+\\s*\\(');
    });

    it('should escape special regex characters', () => {
      expect(patternBuilder.methodCallPattern('$scope', '$apply')).toBe(
        '\\b\\$scope\\s*\\.\\s*\\$apply\\s*\\(',
      );
    });
  });

  describe('stringContainingPattern', () => {
    it('should build pattern for strings containing text', () => {
      const pattern = patternBuilder.stringContainingPattern('TODO');
      expect(pattern).toContain('"[^"\\n]*?TODO[^"\\n]*?"');
      expect(pattern).toContain("'[^'\\n]*?TODO[^'\\n]*?'");
      expect(pattern).toContain('`[^`]*?TODO[^`]*?`');
    });

    it('should escape special characters in text', () => {
      const pattern = patternBuilder.stringContainingPattern('$special.chars[]');
      expect(pattern).toContain('\\$special\\.chars\\[\\]');
    });

    it('should support specific quote types', () => {
      const pattern = patternBuilder.stringContainingPattern('test', ['"']);
      expect(pattern).toBe('("[^"\\n]*?test[^"\\n]*?")');
    });
  });

  describe('xpathPattern', () => {
    it('should build basic XPath', () => {
      expect(patternBuilder.xpathPattern('CallExpression')).toBe('//CallExpression');
    });

    it('should add attribute conditions', () => {
      const xpath = patternBuilder.xpathPattern('CallExpression', {
        name: 'eval',
        dangerous: 'true',
      });
      expect(xpath).toBe('//CallExpression[@name="eval" and @dangerous="true"]');
    });
  });

  describe('todoCommentPattern', () => {
    it('should build pattern for TODO comments', () => {
      const pattern = patternBuilder.todoCommentPattern();
      expect(pattern).toContain('TODO');
      expect(pattern).toContain('FIXME');
      expect(pattern).toContain('HACK');
      expect(pattern).toContain('XXX');
    });

    it('should support custom keywords', () => {
      const pattern = patternBuilder.todoCommentPattern(['CUSTOM', 'KEYWORD']);
      expect(pattern).toContain('CUSTOM|KEYWORD');
    });

    it('should support case sensitivity', () => {
      const pattern = patternBuilder.todoCommentPattern(['TODO'], true);
      expect(pattern).not.toContain('i'); // No case-insensitive flag
    });
  });
});

describe('messageTemplateUtils', () => {
  describe('format', () => {
    it('should replace placeholders with values', () => {
      const template = 'Found {count} issues in {file}';
      const result = messageTemplateUtils.format(template, {
        count: '3',
        file: 'app.js',
      });
      expect(result).toBe('Found 3 issues in app.js');
    });

    it('should keep unmatched placeholders', () => {
      const template = 'Missing {value} here';
      const result = messageTemplateUtils.format(template, {});
      expect(result).toBe('Missing {value} here');
    });
  });

  describe('getTemplate', () => {
    it('should return predefined templates', () => {
      expect(messageTemplateUtils.getTemplate('security')).toBe(
        'Potential security vulnerability: {description}',
      );
      expect(messageTemplateUtils.getTemplate('performance')).toBe(
        'Performance issue: {description}',
      );
    });

    it('should return null for unknown templates', () => {
      expect(
        messageTemplateUtils.getTemplate('unknown' as keyof typeof messageTemplateUtils.templates),
      ).toBeNull();
    });
  });
});

describe('ruleMigrationUtils', () => {
  describe('migrateFromV1', () => {
    it('should migrate v1 rule to v2 format', () => {
      const v1Rule = {
        key: 'my-rule',
        template_key: 'javascript:S124',
        name: 'My Rule',
        html_desc: '<p>Rule description</p>',
        status: 'READY',
        params: {
          message: 'Error found',
          threshold: '10',
        },
      };

      const v2Rule = ruleMigrationUtils.migrateFromV1(v1Rule);

      expect(v2Rule).toEqual({
        key: 'my-rule',
        templateKey: 'javascript:S124',
        name: 'My Rule',
        markdownDescription: '<p>Rule description</p>',
        status: 'READY',
        parameters: [
          { key: 'message', value: 'Error found' },
          { key: 'threshold', value: '10' },
        ],
      });
    });

    it('should handle different field variations', () => {
      const v1Rule = {
        custom_key: 'custom-rule',
        templateKey: 'java:S456', // already in v2 format
        name: 'Custom Rule',
        markdown_description: 'Markdown desc',
        parameters: [
          // array format
          { key: 'param1', value: 'value1' },
        ],
      };

      const v2Rule = ruleMigrationUtils.migrateFromV1(v1Rule);

      expect(v2Rule.key).toBe('custom-rule');
      expect(v2Rule.templateKey).toBe('java:S456');
      expect(v2Rule.markdownDescription).toBe('Markdown desc');
      expect(v2Rule.parameters).toEqual([{ key: 'param1', value: 'value1' }]);
    });

    it('should handle missing fields gracefully', () => {
      const v1Rule = {};
      const v2Rule = ruleMigrationUtils.migrateFromV1(v1Rule);

      expect(v2Rule).toEqual({
        key: '',
        templateKey: '',
        name: undefined,
        markdownDescription: '',
        status: 'READY',
        parameters: [],
      });
    });
  });

  describe('exportRules', () => {
    it('should export rules as JSON', () => {
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
          createdAt: '2025-01-30T10:00:00Z',
          updatedAt: '2025-01-30T10:00:00Z',
          language: 'js',
          tags: ['best-practice'],
        },
      ];

      const exported = ruleMigrationUtils.exportRules(rules);
      const parsed = JSON.parse(exported) as Array<{
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

    it('should include metadata when requested', () => {
      const rules: CreateCustomRuleV2Response[] = [
        {
          id: 'AY123',
          repositoryKey: 'javascript',
          key: 'test-rule',
          name: 'Test Rule',
          status: 'READY',
          impacts: [],
          createdAt: '2025-01-30T10:00:00Z',
          language: 'js',
          tags: ['test'],
        },
      ];

      const exported = ruleMigrationUtils.exportRules(rules, { includeMetadata: true });
      const parsed = JSON.parse(exported) as Array<{
        key: string;
        templateKey: string;
        name: string;
        markdownDescription: string;
        status: string;
        parameters: Array<{ key: string; value: string }>;
      }>;

      expect(parsed[0].metadata).toEqual({
        createdAt: '2025-01-30T10:00:00Z',
        language: 'js',
        tags: ['test'],
        impacts: [],
      });
    });

    it('should export as YAML-like format', () => {
      const rules: CreateCustomRuleV2Response[] = [
        {
          id: 'AY123',
          key: 'test-rule',
          name: 'Test Rule',
          markdownDescription: 'Line 1\nLine 2',
          status: 'READY',
          templateKey: 'test:template',
          parameters: [{ key: 'param1', defaultValue: 'value1' }],
          impacts: [],
        },
      ];

      const exported = ruleMigrationUtils.exportRules(rules, { format: 'yaml' });

      expect(exported).toContain('- key: test-rule');
      expect(exported).toContain('  templateKey: test:template');
      expect(exported).toContain('  name: Test Rule');
      expect(exported).toContain('  markdownDescription: |');
      expect(exported).toContain('    Line 1');
      expect(exported).toContain('    Line 2');
      expect(exported).toContain('  parameters:');
      expect(exported).toContain('    - key: param1');
      expect(exported).toContain('      value: "value1"');
    });
  });
});

describe('cleanCodeAttributeUtils', () => {
  describe('fromSeverity', () => {
    it('should map severity to clean code attribute', () => {
      expect(cleanCodeAttributeUtils.fromSeverity('INFO')).toBe('CONVENTIONAL');
      expect(cleanCodeAttributeUtils.fromSeverity('MINOR')).toBe('IDENTIFIABLE');
      expect(cleanCodeAttributeUtils.fromSeverity('MAJOR')).toBe('LOGICAL');
      expect(cleanCodeAttributeUtils.fromSeverity('CRITICAL')).toBe('TESTED');
      expect(cleanCodeAttributeUtils.fromSeverity('BLOCKER')).toBe('TRUSTWORTHY');
    });
  });

  describe('qualityFromType', () => {
    it('should map issue type to software quality', () => {
      expect(cleanCodeAttributeUtils.qualityFromType('CODE_SMELL')).toBe('MAINTAINABILITY');
      expect(cleanCodeAttributeUtils.qualityFromType('BUG')).toBe('RELIABILITY');
      expect(cleanCodeAttributeUtils.qualityFromType('VULNERABILITY')).toBe('SECURITY');
      expect(cleanCodeAttributeUtils.qualityFromType('SECURITY_HOTSPOT')).toBe('SECURITY');
    });
  });

  describe('impactSeverityFromSeverity', () => {
    it('should map severity to impact severity', () => {
      expect(cleanCodeAttributeUtils.impactSeverityFromSeverity('INFO')).toBe('LOW');
      expect(cleanCodeAttributeUtils.impactSeverityFromSeverity('MINOR')).toBe('LOW');
      expect(cleanCodeAttributeUtils.impactSeverityFromSeverity('MAJOR')).toBe('MEDIUM');
      expect(cleanCodeAttributeUtils.impactSeverityFromSeverity('CRITICAL')).toBe('HIGH');
      expect(cleanCodeAttributeUtils.impactSeverityFromSeverity('BLOCKER')).toBe('HIGH');
    });
  });
});
