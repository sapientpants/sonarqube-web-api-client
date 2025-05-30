# Current Implementation Plan: Analysis v2 API

## Overview

This document outlines the comprehensive plan to implement the Analysis v2 API, which provides scanner management and project analysis functionality. This is the next high-priority item from the V2_API_IMPLEMENTATION_STATUS_AND_PLAN.md.

The Analysis API is critical infrastructure that enables:
- Scanner engine management and downloads
- JRE distribution for scanners
- Active rule retrieval for project analysis
- Server version information

## Timeline: 5 Days

### Phase 0: Research & Design (Day 1)

#### 1. API Endpoint Analysis

The Analysis v2 API consists of 5 endpoints:

```
GET /api/v2/analysis/active_rules - Get all active rules for a specific project
GET /api/v2/analysis/engine - Scanner engine download/metadata
GET /api/v2/analysis/jres - All JREs metadata  
GET /api/v2/analysis/jres/{id} - JRE download/metadata
GET /api/v2/analysis/version - Server version
```

#### 2. Unique Challenges

- **Binary Downloads**: Engine and JRE downloads return binary data (ZIP files)
- **Conditional Responses**: Some endpoints return metadata OR binary based on headers
- **Large Files**: JREs can be 100+ MB, need streaming support
- **Caching**: Downloads should support HTTP caching headers
- **Authentication**: Some endpoints may work without auth for public instances

### Phase 1: Type System Design (Day 1-2)

#### 1. Core Types

```typescript
// Active Rules Types
export interface GetActiveRulesV2Request {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
}

export interface ActiveRuleV2 {
  ruleKey: string;
  repository: string;
  name: string;
  language: string;
  severity: 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
  type: 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';
  params?: Record<string, string>;
  templateKey?: string;
}

export interface GetActiveRulesV2Response {
  rules: ActiveRuleV2[];
  total: number;
}

// Engine Types
export interface EngineMetadataV2 {
  filename: string;
  sha256: string;
  downloadUrl: string;
  minimumSqVersion?: string;
}

// JRE Types
export interface JreMetadataV2 extends V2Resource {
  filename: string;
  sha256: string;
  javaPath: string;
  os: 'windows' | 'linux' | 'macos' | 'alpine';
  arch: 'x64' | 'aarch64';
  minimumSqVersion?: string;
}

export interface GetJresV2Response {
  jres: JreMetadataV2[];
}

// Version Types
export interface VersionV2Response {
  version: string;
  buildNumber?: string;
  commitId?: string;
}
```

#### 2. Response Type Handling

Need to handle different response types:
- JSON metadata responses
- Binary file downloads (application/octet-stream)
- Conditional responses based on Accept headers

### Phase 2: Client Implementation (Day 2-3)

#### 1. Create AnalysisClient

```
src/resources/analysis/
├── AnalysisClient.ts
├── types.ts
├── index.ts
└── __tests__/
    └── AnalysisClient.test.ts
```

#### 2. Implementation Strategy

```typescript
export class AnalysisClient extends BaseClient {
  /**
   * Get all active rules for a specific project
   * @since 10.3
   */
  async getActiveRulesV2(params: GetActiveRulesV2Request): Promise<GetActiveRulesV2Response> {
    const query = this.buildV2Query(params as Record<string, unknown>);
    return this.request(`/api/v2/analysis/active_rules?${query}`);
  }

  /**
   * Get scanner engine metadata
   * @since 10.3
   */
  async getEngineMetadataV2(): Promise<EngineMetadataV2> {
    return this.request('/api/v2/analysis/engine', {
      headers: { Accept: 'application/json' }
    });
  }

  /**
   * Download scanner engine
   * @since 10.3
   */
  async downloadEngineV2(): Promise<Blob> {
    return this.request('/api/v2/analysis/engine', {
      responseType: 'blob',
      headers: { Accept: 'application/octet-stream' }
    });
  }

  /**
   * Get all available JREs metadata
   * @since 10.3
   */
  async getAllJresMetadataV2(): Promise<GetJresV2Response> {
    return this.request('/api/v2/analysis/jres');
  }

  /**
   * Get specific JRE metadata
   * @since 10.3
   */
  async getJreMetadataV2(id: string): Promise<JreMetadataV2> {
    return this.request(`/api/v2/analysis/jres/${id}`, {
      headers: { Accept: 'application/json' }
    });
  }

  /**
   * Download specific JRE
   * @since 10.3
   */
  async downloadJreV2(id: string): Promise<Blob> {
    return this.request(`/api/v2/analysis/jres/${id}`, {
      responseType: 'blob',
      headers: { Accept: 'application/octet-stream' }
    });
  }

  /**
   * Get server version information
   * @since 10.3
   */
  async getVersionV2(): Promise<VersionV2Response> {
    return this.request('/api/v2/analysis/version');
  }
}
```

#### 3. Binary Download Handling

Update BaseClient to support different response types:

```typescript
// In BaseClient
protected async request<T>(
  url: string,
  options?: RequestInit & { responseType?: ResponseType }
): Promise<T> {
  // Handle responseType: 'blob', 'arrayBuffer', 'text', 'json'
  // Properly handle large file downloads
  // Support streaming for better memory efficiency
}
```

### Phase 3: Testing Strategy (Day 3-4)

#### 1. Unit Tests

```typescript
describe('AnalysisClient', () => {
  describe('getActiveRulesV2', () => {
    it('should fetch active rules for a project');
    it('should handle branch parameter');
    it('should handle pull request parameter');
    it('should handle empty rules response');
  });

  describe('engine endpoints', () => {
    it('should fetch engine metadata with JSON accept header');
    it('should download engine binary with octet-stream header');
    it('should handle download errors');
  });

  describe('JRE endpoints', () => {
    it('should list all available JREs');
    it('should filter JREs by OS and architecture');
    it('should fetch specific JRE metadata');
    it('should download JRE binary');
    it('should handle large file downloads');
  });

  describe('version endpoint', () => {
    it('should fetch server version');
    it('should work without authentication');
  });
});
```

#### 2. MSW Handlers for Binary Responses

```typescript
// Mock binary responses
http.get('*/api/v2/analysis/engine', ({ request }) => {
  const acceptHeader = request.headers.get('accept');
  
  if (acceptHeader?.includes('application/json')) {
    return HttpResponse.json({
      filename: 'sonar-scanner-engine-10.3.0.1234.jar',
      sha256: 'abc123...',
      downloadUrl: '/api/v2/analysis/engine'
    });
  } else {
    // Return mock binary data
    const buffer = new ArrayBuffer(1024);
    return new HttpResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="sonar-scanner-engine.jar"'
      }
    });
  }
});
```

#### 3. Integration Testing Considerations

- Test timeout handling for large downloads
- Test progress tracking capabilities
- Test resume/retry for failed downloads
- Test caching header handling

### Phase 4: Advanced Features (Day 4-5)

#### 1. Download Progress Tracking

```typescript
interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
}

interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

async downloadEngineV2(options?: DownloadOptions): Promise<Blob> {
  // Implement progress tracking using fetch API
}
```

#### 2. Caching Support

```typescript
interface CacheOptions {
  checkCache?: boolean;
  cacheDir?: string;
}

// Check SHA256 before downloading
// Support If-None-Match headers
// Cache downloads locally
```

#### 3. Streaming Support

For very large JRE downloads:

```typescript
async downloadJreV2Stream(id: string): Promise<ReadableStream> {
  // Return stream instead of loading entire file in memory
}
```

### Phase 5: Documentation & Polish (Day 5)

#### 1. API Documentation

- Document all public methods with JSDoc
- Include examples for each endpoint
- Document binary download best practices
- Add troubleshooting guide for download issues

#### 2. Usage Examples

```typescript
// Example: Download scanner engine with progress
const blob = await client.analysis.downloadEngineV2({
  onProgress: (progress) => {
    console.log(`Downloaded ${progress.percentage}%`);
  }
});

// Save to file (Node.js)
const buffer = await blob.arrayBuffer();
fs.writeFileSync('sonar-scanner-engine.jar', Buffer.from(buffer));

// Example: Get JRE for current platform
const jres = await client.analysis.getAllJresMetadataV2();
const currentPlatformJre = jres.jres.find(jre => 
  jre.os === process.platform && jre.arch === process.arch
);
```

## Implementation Checklist

### Day 1: Research & Type Design
- [x] Research Analysis API documentation thoroughly
- [x] Design comprehensive type system
- [x] Plan binary download strategy
- [x] Create module structure

### Days 2-3: Core Implementation
- [x] Implement getActiveRulesV2 with query parameters
- [x] Implement engine metadata/download endpoints
- [x] Implement JRE listing and metadata endpoints
- [x] Implement JRE download with streaming support
- [x] Implement version endpoint
- [x] Add proper error handling for downloads
- [x] Add download progress tracking (implemented in downloadWithProgress)
- [x] Add streaming support for large files

### Days 3-4: Testing
- [x] Unit tests for all endpoints
- [x] MSW handlers for JSON responses
- [x] MSW handlers for binary responses
- [x] Test large file download scenarios
- [x] Test error scenarios (network, timeout, etc.)
- [x] Test authentication requirements
- [x] Update main SonarQubeClient to include AnalysisClient
- [x] Update exports in index.ts

### Days 4-5: Advanced Features & Documentation
- [ ] Add caching support (optional - skipped for initial implementation)
- [ ] Create comprehensive documentation
- [ ] Add usage examples to README
- [ ] Update CHANGELOG.md

## Technical Considerations

### 1. Binary Download Handling

- Need to update BaseClient to support different response types
- Consider memory efficiency for large downloads
- Handle network interruptions gracefully
- Support progress tracking for UX

### 2. Authentication

- Some endpoints may work without auth (version)
- Others require authentication (active rules)
- Document authentication requirements clearly

### 3. Cross-Platform Considerations

- JRE selection based on OS/architecture
- Path handling differences between platforms
- Binary file handling in browser vs Node.js

### 4. Performance

- Implement streaming for large downloads
- Support HTTP caching headers
- Consider connection pooling for multiple downloads

## Success Criteria

1. All 5 Analysis v2 endpoints implemented
2. Binary downloads working reliably
3. Comprehensive test coverage including download scenarios
4. Clear documentation with examples
5. Progress tracking for better UX
6. Proper error handling and recovery

## API Endpoints Summary

### Active Rules
- `GET /api/v2/analysis/active_rules?projectKey={key}` - Get all active rules for analysis

### Scanner Engine
- `GET /api/v2/analysis/engine` - Get metadata (JSON) or download (binary)

### JREs
- `GET /api/v2/analysis/jres` - List all available JREs
- `GET /api/v2/analysis/jres/{id}` - Get metadata (JSON) or download (binary)

### Version
- `GET /api/v2/analysis/version` - Get server version info

## Risk Mitigation

### 1. Large File Downloads
- Implement streaming to avoid memory issues
- Add timeout configuration
- Support resume on failure

### 2. Network Reliability
- Implement retry logic
- Provide clear error messages
- Support offline caching

### 3. Platform Compatibility
- Test on multiple platforms
- Handle path separators correctly
- Consider browser limitations

## Next Steps After Completion

1. Update main client to include AnalysisClient
2. Add integration tests with real file downloads
3. Create examples for common scanner scenarios
4. Consider adding CLI tool for downloads
5. Plan SCA API implementation (next high priority)

## References

- SonarQube Scanner Documentation
- SonarQube Web API v2 Documentation
- HTTP Range Requests (for resume support)
- Streaming API Documentation

## Implementation Status

### ✅ Completed (January 30, 2025)

The Analysis v2 API has been fully implemented with all features:

1. **Types and Interfaces** - Complete type definitions for all endpoints
2. **AnalysisClient** - Full implementation with:
   - Active rules retrieval with branch/PR support
   - Engine metadata and binary download
   - JRE listing, metadata, and downloads
   - Server version endpoint
   - Progress tracking for downloads
   - Streaming support for large files
3. **Testing** - Comprehensive test coverage including:
   - All endpoint functionality
   - Binary download handling
   - Progress tracking
   - Error scenarios
   - MSW v2 handlers for both JSON and binary responses
4. **Integration** - AnalysisClient integrated into main SonarQubeClient
5. **Exports** - All types properly exported in index.ts

### 🔲 Remaining Tasks

- Add usage examples to README
- Update CHANGELOG.md
- Consider adding caching support in future release