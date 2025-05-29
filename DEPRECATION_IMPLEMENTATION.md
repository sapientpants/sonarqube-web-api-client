# Deprecation Implementation Summary

## Completed Tasks

### Added DeprecationManager.warn() calls to all remaining deprecated APIs:

1. **MetricsClient.domains()** - deprecated since 7.7
   - Added deprecation warning with removeVersion: '7.7'
   - Reason: "This endpoint has been deprecated and will be removed."

2. **QualityProfilesClient.exporters() and importers()** - deprecated, will be removed March 18, 2025
   - Added deprecation warnings with removeVersion: 'March 18, 2025'
   - Reason: "This endpoint will be removed."

3. **PermissionsClient.searchGlobalPermissions() and searchProjectPermissions()** - deprecated since 6.5
   - Added deprecation warnings with removeVersion: '6.5'
   - Reason: "This endpoint has been deprecated and will be removed."

4. **CE ActivityBuilder.withComponentId()** - deprecated since 8.0
   - Added deprecation warning with removeVersion: '8.0'
   - Replacement: "withComponent()"
   - Reason: "This method has been deprecated."

5. **ALM BitbucketCloudReposSearchBuilder.withRepositoryName()** - deprecated
   - Added deprecation warning without removeVersion (future version)
   - Replacement: "withRepoSlug()"
   - Reason: "This method has been deprecated."

## Implementation Details

- All deprecation warnings use the `DeprecationManager.warn()` method with proper `DeprecationContext` objects
- Warnings include appropriate metadata (api, removeVersion, replacement, reason)
- All existing functionality remains intact - the deprecated methods still work as expected
- Deprecation warnings are shown only once per API to avoid console spam
- Added tests to verify deprecation warnings are displayed correctly

## Testing

Created comprehensive tests to ensure:
- Deprecation warnings are displayed when deprecated methods are called
- Warnings are shown only once per API
- Deprecated methods continue to function correctly
- All existing tests continue to pass

## Files Modified

1. `/src/resources/metrics/MetricsClient.ts` - Added DeprecationManager import and warning for domains()
2. `/src/resources/quality-profiles/QualityProfilesClient.ts` - Added warnings for exporters() and importers()
3. `/src/resources/permissions/PermissionsClient.ts` - Added warnings for searchGlobalPermissions() and searchProjectPermissions()
4. `/src/resources/ce/builders.ts` - Added warning for ActivityBuilder.withComponentId()
5. `/src/resources/alm-integrations/builders.ts` - Added warning for BitbucketCloudReposSearchBuilder.withRepositoryName()

## New Test Files

1. `/src/resources/alm-integrations/__tests__/deprecated-builders.test.ts` - Tests for ALM deprecated methods
2. `/src/resources/ce/__tests__/deprecated-builders.test.ts` - Tests for CE deprecated methods

All implementations follow the established pattern from the existing deprecated APIs (users.search(), projects.bulkUpdateKey(), components.search()).