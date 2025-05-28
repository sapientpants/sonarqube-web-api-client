import {
  ProjectTagsClient,
  type SearchTagsParams,
  type SearchTagsResponse,
  type SetProjectTagsParams,
} from '../index';

describe('Project Tags Index', () => {
  it('should export ProjectTagsClient', () => {
    expect(ProjectTagsClient).toBeDefined();
    expect(typeof ProjectTagsClient).toBe('function');
  });

  it('should create ProjectTagsClient instance', () => {
    const client = new ProjectTagsClient('https://example.com', 'token');
    expect(client).toBeInstanceOf(ProjectTagsClient);
  });

  it('should export type definitions', () => {
    // Test that the types are exported by creating instances with them
    const searchParams: SearchTagsParams = {
      ps: 10,
      q: 'test',
    };
    expect(searchParams).toBeDefined();

    const searchResponse: SearchTagsResponse = {
      tags: ['tag1', 'tag2'],
    };
    expect(searchResponse).toBeDefined();

    const setParams: SetProjectTagsParams = {
      project: 'test-project',
      tags: 'tag1, tag2',
    };
    expect(setParams).toBeDefined();
  });

  it('should ensure type compatibility', () => {
    // Verify that the types can be used correctly
    const searchParams: SearchTagsParams = {};
    expect(searchParams).toEqual({});

    const minimalSearchParams: SearchTagsParams = { ps: 5 };
    expect(minimalSearchParams.ps).toBe(5);
    expect(minimalSearchParams.q).toBeUndefined();

    const fullSearchParams: SearchTagsParams = { ps: 20, q: 'finance' };
    expect(fullSearchParams.ps).toBe(20);
    expect(fullSearchParams.q).toBe('finance');
  });
});
