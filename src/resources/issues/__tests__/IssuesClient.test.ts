import { IssuesClient } from '../IssuesClient';
import { SearchIssuesBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import type { IssueTransition } from '../types';

describe('IssuesClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: IssuesClient;

  beforeEach(() => {
    client = new IssuesClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return a SearchIssuesBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchIssuesBuilder);
    });
  });

  describe('addComment', () => {
    it('should add a comment to an issue successfully', async () => {
      const result = await client.addComment({
        issue: 'issue-1',
        text: 'This is a comment',
        isFeedback: false,
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments).toHaveLength(1);
      expect(result.issue.comments?.[0].markdown).toBe('This is a comment');
    });

    it('should handle feedback comments', async () => {
      const result = await client.addComment({
        issue: 'issue-1',
        text: 'This is feedback',
        isFeedback: true,
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.comments).toHaveLength(1);
      expect(result.issue.comments?.[0].markdown).toBe('This is feedback');
    });

    it('should throw on server error', async () => {
      server.use(
        http.post('*/api/issues/add_comment', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        client.addComment({
          issue: 'issue-1',
          text: 'This will fail',
        })
      ).rejects.toThrow();
    });
  });

  describe('assign', () => {
    it('should assign an issue to a user', async () => {
      const result = await client.assign({
        issue: 'issue-1',
        assignee: 'john.doe',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.assignee).toBe('john.doe');
    });

    it('should unassign an issue when no assignee is provided', async () => {
      const result = await client.assign({
        issue: 'issue-1',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.assignee).toBeUndefined();
    });

    it('should throw on authentication error', async () => {
      server.use(
        http.post('*/api/issues/assign', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Unauthorized' }] }), {
            status: 401,
          });
        })
      );

      await expect(
        client.assign({
          issue: 'issue-1',
          assignee: 'john.doe',
        })
      ).rejects.toThrow();
    });
  });

  describe('doTransition', () => {
    it('should perform a confirm transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'confirm',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('CONFIRMED');
    });

    it('should perform a resolve transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'resolve',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('RESOLVED');
      expect(result.issue.resolution).toBe('FIXED');
    });

    it('should perform a false positive transition', async () => {
      const result = await client.doTransition({
        issue: 'issue-1',
        transition: 'falsepositive',
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.status).toBe('RESOLVED');
      expect(result.issue.resolution).toBe('FALSE-POSITIVE');
    });

    it('should throw on invalid transition', async () => {
      server.use(
        http.post('*/api/issues/do_transition', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Invalid transition' }] }), {
            status: 400,
          });
        })
      );

      await expect(
        client.doTransition({
          issue: 'issue-1',
          transition: 'invalid' as IssueTransition,
        })
      ).rejects.toThrow();
    });
  });

  describe('setTags', () => {
    it('should set tags on an issue', async () => {
      const result = await client.setTags({
        issue: 'issue-1',
        tags: ['security', 'performance'],
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.tags).toEqual(['security', 'performance']);
    });

    it('should clear tags when empty array is provided', async () => {
      const result = await client.setTags({
        issue: 'issue-1',
        tags: [],
      });

      expect(result.issue.key).toBe('issue-1');
      expect(result.issue.tags).toEqual([]);
    });

    it('should throw on permission error', async () => {
      server.use(
        http.post('*/api/issues/set_tags', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Forbidden' }] }), {
            status: 403,
          });
        })
      );

      await expect(
        client.setTags({
          issue: 'issue-1',
          tags: ['security'],
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.post('*/api/issues/add_comment', () => {
          return HttpResponse.error();
        })
      );

      await expect(
        client.addComment({
          issue: 'issue-1',
          text: 'Test comment',
        })
      ).rejects.toThrow();
    });

    it('should handle unauthorized requests', async () => {
      const unauthorizedClient = new IssuesClient(baseUrl, 'invalid-token');

      await expect(
        unauthorizedClient.addComment({
          issue: 'issue-1',
          text: 'Test comment',
        })
      ).rejects.toThrow();
    });
  });
});
