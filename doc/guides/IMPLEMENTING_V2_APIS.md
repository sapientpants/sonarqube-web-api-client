# Implementing SonarQube Web API v2 Support

This guide provides step-by-step instructions for adding v2 API support to existing client classes.

## Table of Contents
- [Overview](#overview)
- [Implementation Steps](#implementation-steps)
- [Code Examples](#code-examples)
- [Testing v2 APIs](#testing-v2-apis)
- [Migration Guide Template](#migration-guide-template)

## Overview

SonarQube Web API v2 follows REST standards and gradually replaces v1 endpoints. When implementing v2 support:

1. **Add v2 methods** alongside existing v1 methods
2. **Deprecate v1 methods** when v2 equivalents exist
3. **Use separate types** for v2 requests/responses
4. **Follow REST conventions** (GET, POST, PATCH, DELETE)

## Implementation Steps

### Step 1: Check for v2 Endpoint

First, verify if a v2 endpoint exists in SonarQube:

```bash
# Check your SonarQube instance
curl https://your-sonarqube.com/api/v2/projects
```

Or check the Web API v2 documentation at `/web_api_v2` in your SonarQube instance.

### Step 2: Define v2 Types

Create v2-specific types in the module's `types.ts`:

```typescript
// Existing v1 types
export interface Project {
  key: string;
  name: string;
  qualifier: string;
  // ...
}

// New v2 types
export interface ProjectV2 {
  id: string;              // v2 uses UUIDs
  key: string;
  name: string;
  type: ProjectType;       // v2 uses enums
  visibility: Visibility;
  managed: boolean;        // v2 has new fields
  // ...
}

export interface SearchProjectsV2Request {
  query?: string;
  types?: ProjectType[];
  visibility?: Visibility;
  managed?: boolean;
  page?: number;           // v2 uses page-based pagination
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchProjectsV2Response {
  projects: ProjectV2[];
  page: PageInfo;
}

export interface PageInfo {
  pageIndex: number;
  pageSize: number;
  total: number;
}
```

### Step 3: Create v2 Builder

Create a v2-specific builder if the endpoint supports complex queries:

```typescript
// src/resources/projects/buildersV2.ts
import { BaseBuilder } from '../../core/builders';
import type { 
  SearchProjectsV2Request, 
  SearchProjectsV2Response, 
  ProjectV2 
} from './types';

export class SearchProjectsV2Builder extends BaseBuilder<
  SearchProjectsV2Request,
  SearchProjectsV2Response
> {
  query(query: string): this {
    return this.setParam('query', query);
  }

  types(types: ProjectType[]): this {
    return this.setParam('types', types);
  }

  visibility(visibility: Visibility): this {
    return this.setParam('visibility', visibility);
  }

  managed(managed: boolean): this {
    return this.setParam('managed', managed);
  }

  page(page: number): this {
    return this.setParam('page', page);
  }

  pageSize(size: number): this {
    return this.setParam('pageSize', size);
  }

  sort(field: string, order: 'asc' | 'desc' = 'asc'): this {
    return this.setParam('sort', field).setParam('order', order);
  }

  async execute(): Promise<SearchProjectsV2Response> {
    return this.executor(this.params as SearchProjectsV2Request);
  }

  async *all(): AsyncGenerator<ProjectV2> {
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(currentPage).execute();
      
      for (const project of response.projects) {
        yield project;
      }

      hasMore = response.page.pageIndex * response.page.pageSize < response.page.total;
      currentPage++;
    }
  }

  protected getItems(response: SearchProjectsV2Response): ProjectV2[] {
    return response.projects;
  }

  protected getNextPageParams(
    response: SearchProjectsV2Response,
    currentParams: SearchProjectsV2Request
  ): SearchProjectsV2Request | null {
    const { page } = response;
    const hasNextPage = page.pageIndex * page.pageSize < page.total;
    
    return hasNextPage 
      ? { ...currentParams, page: (currentParams.page || 1) + 1 }
      : null;
  }
}
```

### Step 4: Implement v2 Methods in Client

Add v2 methods to the existing client class:

```typescript
// src/resources/projects/ProjectsClient.ts
import { Deprecated } from '../../core/deprecation';
import { SearchProjectsV2Builder } from './buildersV2';

export class ProjectsClient extends BaseClient {
  // Existing v1 method - now deprecated
  @Deprecated({
    deprecatedSince: '10.5',
    removalDate: '11.0',
    replacement: 'searchV2()',
    reason: 'V1 endpoint deprecated in favor of REST-compliant v2 API',
    migrationGuide: '/docs/migration/projects-v2.md',
    examples: [{
      before: 'client.projects.search().query("my-project").execute()',
      after: 'client.projects.searchV2().query("my-project").execute()',
      description: 'Basic search migration'
    }]
  })
  search(): SearchProjectsBuilder {
    return new SearchProjectsBuilder(/* ... */);
  }

  // New v2 search method
  searchV2(): SearchProjectsV2Builder {
    return new SearchProjectsV2Builder(async (params) => {
      const query = new URLSearchParams();
      
      if (params.query) query.append('q', params.query);
      if (params.types) query.append('types', params.types.join(','));
      if (params.visibility) query.append('visibility', params.visibility);
      if (params.managed !== undefined) query.append('managed', String(params.managed));
      if (params.page) query.append('p', String(params.page));
      if (params.pageSize) query.append('ps', String(params.pageSize));
      if (params.sort) query.append('s', params.sort);
      if (params.order) query.append('asc', params.order === 'asc' ? 'true' : 'false');

      const queryString = query.toString();
      const url = queryString ? `/api/v2/projects?${queryString}` : '/api/v2/projects';
      
      return this.request<SearchProjectsV2Response>(url);
    });
  }

  // REST-style CRUD operations (v2 only)
  
  /**
   * Get a single project by ID (v2 API)
   * @param id - The project UUID
   */
  async getProjectV2(id: string): Promise<ProjectV2> {
    return this.request<ProjectV2>(`/api/v2/projects/${id}`);
  }

  /**
   * Create a new project (v2 API)
   * @param data - Project creation data
   */
  async createProjectV2(data: CreateProjectV2Request): Promise<ProjectV2> {
    return this.request<ProjectV2>('/api/v2/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a project (v2 API)
   * @param id - The project UUID
   * @param data - Partial project data to update
   */
  async updateProjectV2(id: string, data: Partial<ProjectV2>): Promise<ProjectV2> {
    return this.request<ProjectV2>(`/api/v2/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a project (v2 API)
   * @param id - The project UUID
   */
  async deleteProjectV2(id: string): Promise<void> {
    await this.request(`/api/v2/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Convenience methods for v2

  /**
   * Search all projects using v2 API
   * @returns Async iterator of all projects
   */
  searchAllV2(): AsyncIterableIterator<ProjectV2> {
    return this.searchV2().all();
  }
}
```

### Step 5: Update BaseClient for v2 Support

Ensure BaseClient properly handles v2-specific requirements:

```typescript
// src/core/BaseClient.ts
export abstract class BaseClient {
  protected async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const isV2 = path.startsWith('/api/v2/');
    
    // V2 APIs require specific headers
    if (isV2) {
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      };
    }

    // Ensure proper error handling for v2
    try {
      const response = await this.httpClient.request<T>(path, options);
      return response;
    } catch (error) {
      if (isV2 && error.response) {
        // V2 has standardized error format
        throw this.mapV2Error(error.response);
      }
      throw error;
    }
  }

  private mapV2Error(response: any): Error {
    // Map v2 error responses to our error types
    const { status, data } = response;
    
    switch (status) {
      case 400:
        return new ValidationError(data.message, data.errors);
      case 401:
        return new AuthenticationError(data.message);
      case 403:
        return new AuthorizationError(data.message);
      case 404:
        return new NotFoundError(data.message);
      case 409:
        return new ConflictError(data.message);
      case 429:
        return new RateLimitError(data.message, data.retryAfter);
      default:
        return new ApiError(data.message, status, data);
    }
  }
}
```

## Testing v2 APIs

### Unit Tests

Create v2-specific test files:

```typescript
// src/resources/projects/__tests__/ProjectsClientV2.test.ts
import { ProjectsClient } from '../ProjectsClient';
import { setupServer } from '../../../test-utils/msw/server';
import { rest } from 'msw';

describe('ProjectsClient v2 API', () => {
  const client = new ProjectsClient({ 
    baseUrl: 'https://sonarqube.example.com',
    token: 'test-token' 
  });

  describe('searchV2', () => {
    it('should search projects with v2 API', async () => {
      server.use(
        rest.get('https://sonarqube.example.com/api/v2/projects', (req, res, ctx) => {
          expect(req.headers.get('Accept')).toBe('application/json');
          
          return res(
            ctx.json({
              projects: [
                {
                  id: 'uuid-1',
                  key: 'project-1',
                  name: 'Project One',
                  type: 'PROJECT',
                  visibility: 'private',
                  managed: false,
                },
              ],
              page: {
                pageIndex: 1,
                pageSize: 100,
                total: 1,
              },
            })
          );
        })
      );

      const response = await client.searchV2()
        .query('project')
        .visibility('private')
        .execute();

      expect(response.projects).toHaveLength(1);
      expect(response.projects[0].id).toBe('uuid-1');
    });
  });

  describe('CRUD operations', () => {
    it('should get a project by ID', async () => {
      server.use(
        rest.get('https://sonarqube.example.com/api/v2/projects/:id', (req, res, ctx) => {
          return res(
            ctx.json({
              id: req.params.id,
              key: 'project-1',
              name: 'Project One',
              type: 'PROJECT',
              visibility: 'private',
              managed: false,
            })
          );
        })
      );

      const project = await client.getProjectV2('uuid-1');
      expect(project.id).toBe('uuid-1');
    });

    it('should update a project', async () => {
      server.use(
        rest.patch('https://sonarqube.example.com/api/v2/projects/:id', async (req, res, ctx) => {
          const body = await req.json();
          
          return res(
            ctx.json({
              id: req.params.id,
              ...body,
            })
          );
        })
      );

      const updated = await client.updateProjectV2('uuid-1', {
        name: 'Updated Name',
        visibility: 'public',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.visibility).toBe('public');
    });
  });
});
```

### Integration Tests

Test v1 to v2 migration scenarios:

```typescript
describe('v1 to v2 migration', () => {
  it('should show deprecation warning when using v1', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await client.projects.search().execute();
    
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATED API USAGE')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Use searchV2() instead')
    );
  });

  it('should produce equivalent results', async () => {
    // Setup both v1 and v2 responses
    const v1Results = await client.projects.search().query('test').execute();
    const v2Results = await client.projects.searchV2().query('test').execute();
    
    // Verify data mapping
    expect(v2Results.projects.map(p => p.key)).toEqual(
      v1Results.projects.map(p => p.key)
    );
  });
});
```

## Migration Guide Template

Create user-facing migration guides:

```markdown
# Migrating Projects API from v1 to v2

## Overview
The Projects API v2 provides improved REST semantics and consistency. 
This guide helps you migrate from v1 to v2.

## Key Changes

### 1. Search Method
```typescript
// Before (v1)
const results = await client.projects.search()
  .query('my-project')
  .qualifiers(['TRK', 'VW'])
  .execute();

// After (v2)  
const results = await client.projects.searchV2()
  .query('my-project')
  .types(['PROJECT', 'PORTFOLIO'])
  .execute();
```

### 2. Response Structure
- Projects now have `id` (UUID) instead of just `key`
- `qualifier` renamed to `type` with new enum values
- New fields: `managed`, `lastAnalysisDate`

### 3. Pagination
- v2 uses page-based pagination (page/pageSize)
- Response includes `page` object with total count

### 4. New REST Operations
```typescript
// Get single project
const project = await client.projects.getProjectV2('uuid');

// Update project
const updated = await client.projects.updateProjectV2('uuid', {
  name: 'New Name',
  visibility: 'public'
});

// Delete project
await client.projects.deleteProjectV2('uuid');
```

## Migration Checklist
- [ ] Update search calls to use `searchV2()`
- [ ] Update type references from `Project` to `ProjectV2`
- [ ] Handle new `id` field for project identification
- [ ] Update pagination logic for page-based approach
- [ ] Review and update error handling
```

## Best Practices

1. **Always deprecate v1 when v2 exists** - Use `@Deprecated` decorator
2. **Maintain backward compatibility** - Never break v1 functionality
3. **Document migration path** - Clear examples in JSDoc
4. **Test both versions** - Ensure parity where expected
5. **Monitor adoption** - Track v2 usage vs v1

## Checklist for Adding v2 Support

- [ ] Verify v2 endpoint exists in SonarQube
- [ ] Create v2 types (request, response, models)
- [ ] Implement v2 builder (if needed)
- [ ] Add v2 methods to client
- [ ] Deprecate v1 methods (if applicable)
- [ ] Write comprehensive tests
- [ ] Update documentation
- [ ] Create migration guide
- [ ] Add examples to JSDoc
- [ ] Update CHANGELOG.md