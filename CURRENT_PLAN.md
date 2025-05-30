# Clean Code Policy API v2 Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to implement the SonarQube Clean Code Policy API v2 (`/api/v2/clean-code-policy/*`) in the sonarqube-web-api-client library. This API enables organizations to define and manage custom code quality rules, implement organization-specific clean code policies, and maintain consistent code standards across projects.

## Context and Strategic Importance

### Why Clean Code Policy API Next?

1. **Organizational Governance**: Enables companies to enforce custom coding standards
2. **Policy as Code**: Aligns with DevSecOps practices by treating quality policies as code
3. **Compliance Requirements**: Helps meet industry-specific compliance standards
4. **Team Autonomy**: Allows teams to define project-specific quality rules
5. **Medium Priority**: Balances importance with implementation complexity

### Current Implementation Status

**✅ Completed v2 APIs (6/8):**
- Users API (`/api/v2/users/*`) - Complete
- System API (`/api/v2/system/*`) - Complete  
- Authorizations API (`/api/v2/authorizations/*`) - Complete
- Analysis API (`/api/v2/analysis/*`) - Complete
- SCA API (`/api/v2/sca/*`) - Complete
- Fix Suggestions API (`/api/v2/fix-suggestions/*`) - Complete

**🔲 Remaining v2 APIs (2/8):**
- **Clean Code Policy API** (`/api/v2/clean-code-policy/*`) - **NEXT** (Medium Priority)
- DOP Translation API (`/api/v2/dop-translation/*`) - Low Priority

## API Overview

### Clean Code Policy API Endpoints

Based on SonarQube v2 API documentation:

1. **`POST /api/v2/clean-code-policy/rules`**
   - **Purpose**: Create custom rules for code quality policies
   - **Method**: POST
   - **Request Body**: Rule definition with patterns, severity, and remediation
   - **Response**: Created rule with unique identifier
   - **Since**: SonarQube 10.6+

### Extended API Capabilities (Research-Based Projections)

While the documentation shows only one endpoint, based on typical policy management patterns and SonarQube's architecture, the API likely supports:

1. **Rule Management**
   - Create custom rules with complex patterns
   - Define rule templates for reuse
   - Set rule parameters and thresholds
   - Configure remediation functions

2. **Policy Definition**
   - Group rules into policies
   - Set policy activation conditions
   - Define quality gate integration
   - Configure policy inheritance

3. **Language Support**
   - Multi-language rule definitions
   - Language-specific patterns
   - Cross-language policy enforcement
   - Framework-specific rules

4. **Integration Features**
   - Quality profile integration
   - Quality gate conditions
   - Project-level overrides
   - Organization-wide defaults

## Implementation Plan: 3-Day Sprint

### Day 1: API Research & Type System Design (8 hours)

#### Hour 1-2: Deep API Research
- **Explore SonarQube Documentation**: Study clean code policy concepts
- **Analyze Rule Structure**: Understand rule definition patterns
- **Research Pattern Syntax**: Learn rule pattern languages (XPath, regex, AST)
- **Study Quality Profiles**: Understand integration with existing profiles

#### Hour 3-4: Type System Architecture
- **Core Types**: Rule definitions, policies, patterns
- **Request/Response Types**: API contracts for rule creation
- **Domain Types**: Severity levels, rule types, languages
- **Pattern Types**: AST patterns, regex patterns, XPath queries

#### Hour 5-6: Advanced Type Design
- **Rule Template System**: Reusable rule patterns
- **Policy Composition**: Combining rules into policies
- **Validation Types**: Pattern validation, syntax checking
- **Integration Types**: Quality profile and gate connections

#### Hour 7-8: Project Structure & Planning
- **Module Setup**: Create clean-code-policy directory structure
- **Export Strategy**: Plan public API surface
- **Testing Strategy**: Design comprehensive test scenarios
- **Documentation Plan**: API documentation structure

**Day 1 Deliverables:**
- Complete type system (`types.ts`)
- Module structure and exports
- Test infrastructure setup
- Research documentation

### Day 2: Core Implementation (8 hours)

#### Hour 1-2: CleanCodePolicyClient Core
- **Base Client Setup**: Extend BaseClient with v2 patterns
- **`createCustomRuleV2()`**: Main rule creation method
- **Request Building**: Parameter validation and formatting
- **Response Handling**: Parse and type API responses

#### Hour 3-4: Builder Pattern Implementation
- **`CustomRuleBuilder`**: Fluent API for rule creation
- **Pattern Builders**: AST, regex, XPath pattern builders
- **Validation Methods**: Client-side pattern validation
- **Chaining Support**: Intuitive method chaining

#### Hour 5-6: Advanced Features
- **Template System**: Rule template creation and application
- **Batch Operations**: Multiple rule creation support
- **Policy Composition**: Combine rules into policies
- **Language Detection**: Auto-detect rule language

#### Hour 7-8: Integration Features
- **Quality Profile Integration**: Link rules to profiles
- **Project Binding**: Apply rules to specific projects
- **Organization Defaults**: Set org-wide policies
- **Import/Export**: Rule serialization support

**Day 2 Deliverables:**
- Complete CleanCodePolicyClient implementation
- Builder pattern with fluent API
- Advanced features (templates, batch operations)
- Integration capabilities

### Day 3: Testing, Utilities & Polish (8 hours)

#### Hour 1-2: Comprehensive Testing
- **Unit Tests**: Test all client methods
- **Builder Tests**: Validate builder patterns
- **Pattern Tests**: Test various rule patterns
- **Integration Tests**: Test with mock SonarQube

#### Hour 3-4: Utility Development
- **Pattern Validators**: Validate AST, regex, XPath patterns
- **Rule Analyzers**: Analyze rule effectiveness
- **Policy Composer**: Build complex policies
- **Migration Tools**: Migrate v1 custom rules

#### Hour 5-6: Error Handling & Edge Cases
- **Pattern Syntax Errors**: Detailed error messages
- **Language Compatibility**: Handle unsupported languages
- **Conflict Resolution**: Handle rule conflicts
- **Performance Optimization**: Efficient pattern matching

#### Hour 7-8: Documentation & Examples
- **API Documentation**: Comprehensive JSDoc
- **Usage Examples**: Real-world scenarios
- **Pattern Library**: Common rule patterns
- **Migration Guide**: From v1 custom rules

**Day 3 Deliverables:**
- 100% test coverage
- Utility classes and helpers
- Complete documentation
- Production-ready implementation

## Technical Design

### Type System

```typescript
// Core rule types
export interface CustomRuleV2Request {
  key: string;
  name: string;
  description: string;
  severity: RuleSeverity;
  type: RuleType;
  language: string;
  pattern: RulePattern;
  parameters?: RuleParameter[];
  tags?: string[];
  remediationFunction?: RemediationFunction;
  template?: string;
}

export interface CustomRuleV2Response {
  id: string;
  key: string;
  name: string;
  description: string;
  severity: RuleSeverity;
  type: RuleType;
  language: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
  pattern: RulePattern;
  parameters: RuleParameter[];
  tags: string[];
  remediationFunction?: RemediationFunction;
  qualityProfiles: string[];
  projects: string[];
  organization?: string;
}

// Pattern types for different rule languages
export type RulePattern = 
  | AstPattern 
  | RegexPattern 
  | XPathPattern 
  | CustomPattern;

export interface AstPattern {
  type: 'ast';
  expression: string;
  nodeType: string;
  attributes?: Record<string, any>;
}

export interface RegexPattern {
  type: 'regex';
  expression: string;
  flags?: string;
  multiline?: boolean;
}

export interface XPathPattern {
  type: 'xpath';
  expression: string;
  namespaces?: Record<string, string>;
}

export interface CustomPattern {
  type: 'custom';
  engine: string;
  expression: string;
  config?: Record<string, any>;
}

// Rule configuration types
export interface RuleParameter {
  key: string;
  name: string;
  description?: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'FLOAT';
  defaultValue?: string;
  options?: string[];
}

export interface RemediationFunction {
  type: 'LINEAR' | 'LINEAR_OFFSET' | 'CONSTANT';
  baseEffort?: string;
  gapMultiplier?: string;
  effortToFix?: string;
}

// Policy composition types
export interface CleanCodePolicy {
  id: string;
  name: string;
  description: string;
  rules: string[];
  qualityProfiles: string[];
  projects?: string[];
  isDefault: boolean;
  inheritance?: PolicyInheritance;
}

export interface PolicyInheritance {
  parent?: string;
  overrides: RuleOverride[];
  additions: string[];
}

export interface RuleOverride {
  ruleKey: string;
  severity?: RuleSeverity;
  parameters?: Record<string, any>;
}

// Builder interfaces
export interface CustomRuleV2Builder {
  withKey(key: string): this;
  withName(name: string): this;
  withDescription(description: string): this;
  withSeverity(severity: RuleSeverity): this;
  withType(type: RuleType): this;
  forLanguage(language: string): this;
  withPattern(pattern: RulePattern): this;
  withAstPattern(nodeType: string, expression: string): this;
  withRegexPattern(expression: string, flags?: string): this;
  withXPathPattern(expression: string): this;
  withParameter(param: RuleParameter): this;
  withTag(tag: string): this;
  withTags(tags: string[]): this;
  withRemediationFunction(func: RemediationFunction): this;
  fromTemplate(templateKey: string): this;
  validate(): ValidationResult;
  execute(): Promise<CustomRuleV2Response>;
}

// Utility types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Analysis types
export interface RuleEffectivenessAnalysis {
  ruleKey: string;
  issuesFound: number;
  falsePositiveRate: number;
  averageRemediationTime: string;
  projectsCovered: number;
  languageDistribution: Record<string, number>;
}

export interface PatternTestResult {
  pattern: RulePattern;
  testFile: string;
  matches: PatternMatch[];
  executionTime: number;
  memoryUsed: number;
}

export interface PatternMatch {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  matchedText: string;
  context: string;
}
```

### Implementation Architecture

```typescript
// Main client implementation
export class CleanCodePolicyClient extends BaseClient {
  /**
   * Create a custom rule for clean code policy
   */
  async createCustomRuleV2(
    request: CustomRuleV2Request
  ): Promise<CustomRuleV2Response> {
    const validated = this.validateRule(request);
    
    return this.request<CustomRuleV2Response>(
      '/api/v2/clean-code-policy/rules',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      }
    );
  }

  /**
   * Create a builder for custom rule creation
   */
  createRule(): CustomRuleV2Builder {
    return new CustomRuleV2BuilderImpl(this);
  }

  /**
   * Validate a rule pattern
   */
  async validatePattern(
    pattern: RulePattern,
    testCode?: string
  ): Promise<ValidationResult> {
    // Implementation for pattern validation
  }

  /**
   * Test a rule against sample code
   */
  async testRule(
    rule: CustomRuleV2Request,
    testFiles: string[]
  ): Promise<PatternTestResult[]> {
    // Implementation for rule testing
  }

  private validateRule(rule: CustomRuleV2Request): CustomRuleV2Request {
    // Comprehensive validation logic
  }
}
```

### Builder Pattern Example

```typescript
// Creating a custom rule using the builder pattern
const rule = await client.cleanCodePolicy
  .createRule()
  .withKey('custom:no-console-log')
  .withName('No Console Logging')
  .withDescription('Prohibits console.log statements in production code')
  .forLanguage('javascript')
  .withSeverity('MAJOR')
  .withType('CODE_SMELL')
  .withAstPattern('CallExpression', `
    callee.type === 'MemberExpression' &&
    callee.object.name === 'console' &&
    callee.property.name === 'log'
  `)
  .withTag('performance')
  .withTag('best-practice')
  .withRemediationFunction({
    type: 'CONSTANT',
    baseEffort: '5min'
  })
  .execute();
```

### Utility Classes

```typescript
// Pattern validator utility
export class PatternValidator {
  static validateAstPattern(pattern: AstPattern): ValidationResult
  static validateRegexPattern(pattern: RegexPattern): ValidationResult
  static validateXPathPattern(pattern: XPathPattern): ValidationResult
  static suggestOptimizations(pattern: RulePattern): string[]
}

// Rule composer utility
export class RuleComposer {
  static composePolicy(rules: CustomRuleV2Response[]): CleanCodePolicy
  static mergeRules(base: CustomRuleV2Request, override: Partial<CustomRuleV2Request>): CustomRuleV2Request
  static generateRuleKey(name: string, language: string): string
}

// Pattern testing utility
export class PatternTester {
  static async testPattern(pattern: RulePattern, code: string): Promise<PatternMatch[]>
  static async benchmarkPattern(pattern: RulePattern, testSuite: string[]): Promise<BenchmarkResult>
  static generateTestCases(pattern: RulePattern): TestCase[]
}

// Migration utility
export class RuleMigrator {
  static migrateV1Rule(v1Rule: any): CustomRuleV2Request
  static exportRules(rules: CustomRuleV2Response[]): string
  static importRules(data: string): CustomRuleV2Request[]
}
```

## Testing Strategy

### Unit Tests
- Client method tests with MSW mocks
- Builder pattern validation tests
- Pattern validation tests
- Error handling scenarios

### Integration Tests
- End-to-end rule creation flow
- Pattern matching accuracy tests
- Quality profile integration tests
- Multi-language support tests

### Pattern Tests
- AST pattern matching tests
- Regex pattern edge cases
- XPath query validation
- Performance benchmarks

### Example Test Cases

```typescript
describe('CleanCodePolicyClient', () => {
  it('should create custom rule with AST pattern', async () => {
    const rule = await client.cleanCodePolicy
      .createRule()
      .withKey('custom:no-var')
      .withName('No var declarations')
      .forLanguage('javascript')
      .withAstPattern('VariableDeclaration', 'kind === "var"')
      .execute();

    expect(rule.key).toBe('custom:no-var');
    expect(rule.pattern.type).toBe('ast');
  });

  it('should validate regex patterns', async () => {
    const result = await client.cleanCodePolicy.validatePattern({
      type: 'regex',
      expression: '\\bconsole\\.log\\b',
      flags: 'g'
    });

    expect(result.valid).toBe(true);
  });

  it('should test rule against sample code', async () => {
    const results = await client.cleanCodePolicy.testRule(
      sampleRule,
      ['test-file.js']
    );

    expect(results[0].matches).toHaveLength(3);
  });
});
```

## Usage Examples

### Example 1: Security Rule for SQL Injection

```typescript
const sqlInjectionRule = await client.cleanCodePolicy
  .createRule()
  .withKey('custom:sql-injection-risk')
  .withName('Potential SQL Injection')
  .withDescription('Detects string concatenation in SQL queries')
  .forLanguage('java')
  .withSeverity('BLOCKER')
  .withType('VULNERABILITY')
  .withRegexPattern(
    'executeQuery\\s*\\([^)]*\\+[^)]*\\)',
    'gm'
  )
  .withTag('security')
  .withTag('owasp-top10')
  .withRemediationFunction({
    type: 'LINEAR',
    gapMultiplier: '30min'
  })
  .execute();
```

### Example 2: Performance Rule for React

```typescript
const reactPerformanceRule = await client.cleanCodePolicy
  .createRule()
  .withKey('custom:react-inline-functions')
  .withName('Avoid inline functions in JSX')
  .withDescription('Inline functions cause unnecessary re-renders')
  .forLanguage('typescript')
  .withSeverity('MINOR')
  .withType('CODE_SMELL')
  .withAstPattern('JSXAttribute', `
    value.type === 'ArrowFunctionExpression' ||
    value.type === 'FunctionExpression'
  `)
  .withParameter({
    key: 'allowedComponents',
    name: 'Components to exclude',
    type: 'STRING',
    defaultValue: 'Button,Link'
  })
  .execute();
```

### Example 3: Policy Composition

```typescript
// Create multiple rules
const rules = await Promise.all([
  client.cleanCodePolicy.createRule()
    .withKey('custom:no-console')
    .withName('No console statements')
    .forLanguage('javascript')
    .withAstPattern('MemberExpression', 'object.name === "console"')
    .execute(),
    
  client.cleanCodePolicy.createRule()
    .withKey('custom:no-debugger')
    .withName('No debugger statements')
    .forLanguage('javascript')
    .withAstPattern('DebuggerStatement', 'true')
    .execute()
]);

// Compose into a policy
const policy = RuleComposer.composePolicy(rules);
```

## Migration from v1 Custom Rules

```typescript
// Migrate existing v1 custom rules
const v1Rules = await getV1CustomRules();

const v2Rules = await Promise.all(
  v1Rules.map(async (v1Rule) => {
    const v2Request = RuleMigrator.migrateV1Rule(v1Rule);
    return client.cleanCodePolicy.createCustomRuleV2(v2Request);
  })
);

// Export rules for backup
const exportData = RuleMigrator.exportRules(v2Rules);
await fs.writeFile('custom-rules-backup.json', exportData);
```

## Integration with Quality Profiles

```typescript
// Create rule and add to quality profile
const customRule = await client.cleanCodePolicy
  .createRule()
  .withKey('custom:team-standard-001')
  .withName('Team Coding Standard #001')
  .execute();

// Activate in quality profile
await client.qualityProfiles
  .activateRule()
  .withRule(customRule.key)
  .inProfile('team-javascript-profile')
  .withSeverity('MAJOR')
  .execute();
```

## Performance Considerations

1. **Pattern Complexity**: AST patterns are more efficient than regex for complex rules
2. **Caching**: Cache validated patterns to avoid repeated validation
3. **Batch Operations**: Create multiple rules in parallel when possible
4. **Testing**: Test patterns on sample code before applying to large codebases

## Security Considerations

1. **Pattern Injection**: Validate and sanitize all pattern inputs
2. **Resource Limits**: Implement timeouts for pattern execution
3. **Access Control**: Respect SonarQube permissions for rule creation
4. **Audit Trail**: Log all custom rule creation and modifications

## Future Enhancements

1. **AI-Assisted Rule Creation**: Use AI to suggest rule patterns
2. **Rule Marketplace**: Share custom rules across organizations
3. **Visual Rule Builder**: GUI for creating complex patterns
4. **Rule Analytics**: Track rule effectiveness and impact

## Conclusion

The Clean Code Policy API v2 implementation will empower organizations to define and enforce custom coding standards, ensuring consistent code quality across all projects. This comprehensive implementation plan provides a solid foundation for building a robust, type-safe, and user-friendly API client that leverages the full power of SonarQube's clean code policy capabilities.

## Implementation Status

### Day 1: COMPLETED ✅
- [x] Hour 1-2: Deep API Research (COMPLETED)
  - ✅ Explored SonarQube v2 API documentation using Puppeteer
  - ✅ Discovered POST /api/v2/clean-code-policy/rules endpoint
  - ✅ Identified request parameters: key, templateKey, name, markdownDescription, status, parameters
  - ✅ Identified response fields: id, repositoryKey, severity, type, impacts, softwareQuality, cleanCodeAttribute
  - ✅ Confirmed permission requirement: 'Administer Quality Profiles'
  - ✅ Discovered template-based rule creation pattern
- [x] Hour 3-4: Type System Architecture (COMPLETED)
  - ✅ Created comprehensive types.ts with all request/response interfaces
  - ✅ Defined enums for RuleStatus, SoftwareQuality, ImpactSeverity, CleanCodeAttribute
  - ✅ Implemented builder pattern with CreateCustomRuleV2Builder and AdvancedCustomRuleBuilder
  - ✅ Created CleanCodePolicyClient with v2 API methods
  - ✅ Added validation interfaces and error handling types
  - ✅ Integrated client into main SonarQubeClient class
- [x] Hour 5-6: Advanced Type Design (COMPLETED)
  - ✅ Created comprehensive utility classes (RuleKeyUtils, TemplateUtils, ParameterUtils)
  - ✅ Implemented PatternBuilder for regex, XPath, and method call patterns
  - ✅ Added MessageTemplateUtils for consistent error messaging
  - ✅ Created RuleMigrationUtils for v1 to v2 migration support
  - ✅ Implemented CleanCodeAttributeUtils for legacy mapping
  - ✅ Created comprehensive test suite for CleanCodePolicyClient
- [x] Hour 7-8: Project Structure & Planning (COMPLETED)
  - ✅ Created complete project structure for clean-code-policy module
  - ✅ Added MSW handlers for Clean Code Policy API v2
  - ✅ Created comprehensive test suite for builders and utilities
  - ✅ Updated exports in index.ts to expose all functionality
  - ✅ Integrated with main test infrastructure
  - ✅ Documented all public APIs with JSDoc comments

### Day 2: Pending
- [ ] Hour 1-2: CleanCodePolicyClient Core
- [ ] Hour 3-4: Builder Pattern Implementation
- [ ] Hour 5-6: Advanced Features
- [ ] Hour 7-8: Integration Features

### Day 3: Pending
- [ ] Hour 1-2: Comprehensive Testing
- [ ] Hour 3-4: Utility Development
- [ ] Hour 5-6: Error Handling & Edge Cases
- [ ] Hour 7-8: Documentation & Examples