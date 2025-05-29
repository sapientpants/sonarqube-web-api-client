# Deprecation Implementation Plan

This document outlines the plan to align the codebase with API_DEPRECATIONS.md and ADR-0009.

## Executive Summary

The deprecation management system is well-architected but underutilized. Key improvements needed:
1. Migrate from manual warnings to decorator-based approach
2. Add missing deprecation warnings for 3 APIs
3. Implement parameter-level deprecations
4. Leverage the Compatibility Bridge for seamless migrations

## Current State Analysis

### ✅ Working Well
- Comprehensive deprecation system implemented (decorators, manager, bridge, registry)
- Most deprecated APIs have warnings (Users, Permissions, Metrics, Projects, Quality Profiles)
- Clear migration paths and examples provided
- V2 implementations for migrated APIs (Users)

### ❌ Gaps Identified
1. **Decorator Adoption**: Using manual DeprecationManager.warn() instead of decorators
2. **Missing Deprecations**:
   - Quality Profiles: `export()` method (critical - deprecated March 2025)
   - Quality Gates: `unsetDefault()` method missing entirely
   - Issues: `setSeverity()` and `setType()` methods missing
3. **Parameter Deprecations**: Not using @DeprecatedParameter for deprecated parameters
4. **Compatibility Bridge**: Implemented but not utilized
5. **Properties API**: Deprecated service not implemented

## Implementation Phases

### Phase 1: Critical Updates (High Priority)
**Timeline**: Immediate
**Goal**: Address APIs with approaching removal dates

#### 1.1 Quality Profiles Export Warning
```typescript
// In QualityProfilesClient.ts
@Deprecated({
  deprecatedSince: '2025-03-18',
  removalDate: '2025-09-18', // Estimated 6 months after deprecation
  replacement: 'backup()',
  reason: 'Export functionality replaced with backup API',
  migrationGuide: 'https://docs.sonarqube.org/latest/api/quality-profiles/',
  examples: [{
    before: 'client.qualityProfiles.export().language("java").qualityProfile("Sonar way").execute()',
    after: 'client.qualityProfiles.backup().language("java").qualityProfile("Sonar way").execute()',
    description: 'Use backup() instead of export()'
  }]
})
export(): ExportQualityProfileBuilder {
  return new ExportQualityProfileBuilder(this.client, 'GET', '/api/qualityprofiles/export');
}
```

#### 1.2 Users API Migration Verification
- Ensure V2 implementation is complete
- Update documentation for August 13, 2025 removal

### Phase 2: Decorator Migration (Medium Priority)
**Timeline**: 1-2 weeks
**Goal**: Migrate all manual deprecations to decorator-based approach

#### 2.1 Convert Existing Deprecations
Replace manual DeprecationManager.warn() calls with decorators:

```typescript
// Before (current approach)
searchGlobalPermissions(): SearchGlobalPermissionsBuilder {
  DeprecationManager.warn({
    api: 'permissions.searchGlobalPermissions',
    deprecatedSince: '6.5',
    replacement: 'Use appropriate permission endpoints',
    // ...
  });
  return new SearchGlobalPermissionsBuilder(...);
}

// After (decorator approach)
@Deprecated({
  deprecatedSince: '6.5',
  replacement: 'Use appropriate permission endpoints',
  reason: 'Global permissions search deprecated in favor of specific permission APIs',
  // ...
})
searchGlobalPermissions(): SearchGlobalPermissionsBuilder {
  return new SearchGlobalPermissionsBuilder(...);
}
```

#### 2.2 APIs to Migrate
- [ ] PermissionsClient: searchGlobalPermissions, searchProjectPermissions
- [ ] MetricsClient: domains
- [ ] ProjectsClient: bulkUpdateKey
- [ ] QualityProfilesClient: exporters, importers, restoreBuiltIn
- [ ] All builder classes with deprecation warnings

### Phase 3: Parameter Deprecations (Medium Priority)
**Timeline**: 1 week
**Goal**: Add @DeprecatedParameter decorators for all deprecated parameters

#### 3.1 High-Impact Parameters
```typescript
// Issues API
class SearchIssuesBuilder {
  @DeprecatedParameter({
    parameterName: 'severities',
    deprecatedSince: '2023-08-25',
    reason: 'Issue severities are now managed automatically',
    replacement: 'Remove severity filtering'
  })
  severities(value: string[]): this {
    return this.setArrayParameter('severities', value);
  }

  @DeprecatedParameter({
    parameterName: 'types',
    deprecatedSince: '2023-08-25',
    reason: 'Issue types are now managed automatically',
    replacement: 'Remove type filtering'
  })
  types(value: string[]): this {
    return this.setArrayParameter('types', value);
  }
}
```

#### 3.2 Parameter List
- Issues: facetMode, resolutions, severities, statuses, types
- Quality Profiles: key parameter (use name/language)
- Permissions: groupId (use groupName)
- Projects: branch, qualifiers
- Component/CE: componentId (use component)
- Measures: developerId, developerKey

### Phase 4: Missing APIs Implementation (Low Priority)
**Timeline**: 2-3 weeks
**Goal**: Implement missing deprecated methods for completeness

#### 4.1 Quality Gates unsetDefault()
```typescript
@Deprecated({
  deprecatedSince: '7.0',
  removalDate: 'Already removed',
  reason: 'Default quality gate is now mandatory',
  replacement: 'Set a different default instead of unsetting',
  breakingChanges: ['Returns 410 Gone status']
})
unsetDefault(): Promise<void> {
  throw new RemovedApiError(
    'qualitygates.unsetDefault has been removed. A default quality gate is mandatory.'
  );
}
```

#### 4.2 Issues setSeverity/setType
Evaluate if these should be implemented or documented as intentionally excluded.

### Phase 5: Compatibility Bridge Integration (Low Priority)
**Timeline**: 1 week
**Goal**: Use CompatibilityBridge for automatic API translation

#### 5.1 Example Implementation
```typescript
// For Users API
const bridgedClient = CompatibilityBridge.create(usersClient, {
  methodMappings: {
    search: {
      targetMethod: 'searchV2',
      parameterMapping: (params) => ({
        ...params,
        organizationIds: params.organization ? [params.organization] : undefined
      })
    }
  }
});
```

### Phase 6: Tooling and Documentation (Ongoing)
**Timeline**: Continuous
**Goal**: Enhance developer experience

#### 6.1 Migration CLI Tool
- Implement automated migration for decorator adoption
- Add parameter deprecation scanning
- Generate migration reports

#### 6.2 Documentation Updates
- Update README with deprecation handling guide
- Create MIGRATION.md for major deprecations
- Add examples to each deprecated API

## Success Metrics

1. **Coverage**: 100% of deprecated APIs have warnings
2. **Decorator Adoption**: All deprecations use decorators
3. **Parameter Warnings**: All deprecated parameters marked
4. **Zero Breaking Changes**: Compatibility bridge prevents breaks
5. **Developer Satisfaction**: Clear migration paths reduce support requests

## Risk Mitigation

1. **Bundle Size**: Use tree-shaking to exclude deprecation code in production
2. **Performance**: Lazy-load migration tools
3. **Backward Compatibility**: Extensive testing of compatibility bridges
4. **Communication**: Clear changelog entries for each deprecation

## Next Steps

1. **Immediate**: Add export() deprecation to QualityProfilesClient
2. **Week 1**: Begin decorator migration for existing deprecations
3. **Week 2**: Implement parameter deprecations
4. **Week 3**: Evaluate missing API implementations
5. **Ongoing**: Documentation and tooling improvements

## Appendix: Decorator Conversion Checklist

- [ ] Identify all DeprecationManager.warn() calls
- [ ] Extract metadata into decorator format
- [ ] Add JSDoc comments for IDE warnings
- [ ] Test decorator functionality
- [ ] Remove manual warning calls
- [ ] Update tests to expect decorator behavior
- [ ] Document in changelog