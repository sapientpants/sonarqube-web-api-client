# SonarQube Web API v2 Status

This document tracks the current status of SonarQube Web API v2 endpoints and their availability in different SonarQube versions.

## Current Status (As of January 2025)

SonarQube is gradually migrating from v1 to v2 APIs. The v2 API follows REST architectural principles and provides better structured responses. However, **not all v1 endpoints have v2 equivalents yet**.

### Available v2 Endpoints

#### Users Management
- ✅ `GET /api/v2/users/search` - Available since SonarQube 10.4
- ✅ Implementation: `UsersClient.searchV2()`

#### System Information
- ✅ `GET /api/v2/system/health` - Available since SonarQube 10.6
- ✅ `GET /api/v2/system/liveness` - Available since SonarQube 10.6  
- ✅ `GET /api/v2/system/migrations-status` - Available since SonarQube 10.6
- ✅ Implementation: `SystemClient.getHealthV2()`

#### Projects (Planned)
- 🔄 `GET /api/v2/projects` - Available since SonarQube 10.5
- 🔄 `POST /api/v2/projects` - Available since SonarQube 10.5
- 🔄 Not yet implemented in this client

#### Other APIs (Planned)
- 🔄 Issues, Rules, Quality Gates, Quality Profiles, Metrics, Settings
- 🔄 Implementation pending

### **NOT AVAILABLE** v2 Endpoints

#### System Information
- ❌ `GET /api/v2/system/status` - **Does not exist**
- ❌ `GET /api/v2/system/info` - **Does not exist**
- ❌ These endpoints are incorrectly implemented in `SystemClient` and should be removed

## Version Detection Logic

The current version detection logic in `customReporter.ts` assumes v2 API support for SonarQube 10.4+, but this is too broad. The logic should be:

1. **Users v2 API**: Available in 10.4+
2. **System v2 Health**: Available in 10.6+ 
3. **System v2 Status/Info**: **Not available in any version yet**

## Integration Test Issues

The integration tests are failing because they attempt to call non-existent endpoints:
- `client.system.getStatusV2()` → calls `/api/v2/system/status` (does not exist)
- `client.system.getInfoV2()` → calls `/api/v2/system/info` (does not exist)

## Recommended Actions

### Immediate Fixes
1. ✅ **DONE**: Update `SystemClient.getStatusV2()` and `SystemClient.getInfoV2()` to throw descriptive errors
2. ✅ **DONE**: Update integration tests to expect these errors instead of API calls
3. ✅ **DONE**: Fix version detection logic to be more granular
4. ✅ **DONE**: Update custom reporter to correctly identify expected failures

### Future Development
1. **Add missing v2 implementations**: Projects, Issues, Rules, etc.
2. **Monitor SonarQube releases**: Watch for when system status/info v2 endpoints become available
3. **Update documentation**: Keep this status document current with each SonarQube release

## Official Documentation

- [SonarQube Web API v2](https://next.sonarqube.com/sonarqube/web_api_v2)
- [SonarQube Web API v1](https://next.sonarqube.com/sonarqube/web_api)
- [SonarSource Blog: Web API v2](https://www.sonarsource.com/blog/new-web-api-v2/)

## Client Library Implementation Status

| API Category | v1 Available | v2 Available | v2 Implemented | Priority |
|--------------|-------------|-------------|----------------|----------|
| System Health | ✅ | ✅ | ✅ | Complete |
| System Status | ✅ | ❌ | ⚠️ (stub) | Wait for SQ |
| System Info | ✅ | ❌ | ⚠️ (stub) | Wait for SQ |
| Users Search | ✅ | ✅ | ✅ | Complete |
| Projects | ✅ | ✅ | ❌ | High |
| Issues | ✅ | 🔄 | ❌ | Medium |
| Rules | ✅ | 🔄 | ❌ | Medium |
| Quality Gates | ✅ | 🔄 | ❌ | Low |
| Quality Profiles | ✅ | 🔄 | ❌ | Low |

Legend:
- ✅ Available/Implemented
- ❌ Not Available/Not Implemented  
- 🔄 Available but not implemented in client
- ⚠️ Implemented but API doesn't exist (should be removed/stubbed)