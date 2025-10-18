// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { ProjectBranchesClient } from '../../../../src/resources/project-branches/ProjectBranchesClient';
import { server } from '../../../../src/test-utils/msw/server';
import {
  type Branch,
  ProjectBranchType,
  QualityGateStatus,
} from '../../../../src/resources/project-branches/types';

describe('ProjectBranchesClient', () => {
  let client: ProjectBranchesClient;
  const baseUrl = 'http://localhost:9000';

  beforeEach(() => {
    client = new ProjectBranchesClient(baseUrl, '');
  });

  describe('list', () => {
    const mockBranches: Branch[] = [
      {
        name: 'main',
        type: ProjectBranchType.Branch,
        isMain: true,
        branchId: 'uuid-main',
        branchUuidV1: 'v1-uuid-main',
        analysisDate: '2023-01-01T00:00:00Z',
        excludedFromPurge: true,
        issueCount: 10,
        bugCount: 2,
        vulnerabilityCount: 1,
        codeSmellCount: 7,
        securityHotspotCount: 0,
        qualityGateStatus: QualityGateStatus.OK,
      },
      {
        name: 'feature-branch',
        type: ProjectBranchType.Branch,
        isMain: false,
        branchId: 'uuid-feature',
        branchUuidV1: 'v1-uuid-feature',
        analysisDate: '2023-01-02T00:00:00Z',
        excludedFromPurge: false,
        issueCount: 5,
        bugCount: 1,
        vulnerabilityCount: 0,
        codeSmellCount: 4,
        securityHotspotCount: 0,
        qualityGateStatus: QualityGateStatus.ERROR,
      },
    ];

    it('should list branches for a project', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_branches/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          return HttpResponse.json({ branches: mockBranches });
        }),
      );

      const result = await client.list().withProject('my-project').execute();

      expect(result.branches).toHaveLength(2);
      expect(result.branches[0].name).toBe('main');
      expect(result.branches[0].isMain).toBe(true);
      expect(result.branches[1].name).toBe('feature-branch');
    });

    it('should list branches by IDs', async () => {
      const branchIds = ['uuid1', 'uuid2', 'uuid3'];

      server.use(
        http.get(`${baseUrl}/api/project_branches/list`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('branchIds')).toBe(branchIds.join(','));
          return HttpResponse.json({ branches: mockBranches });
        }),
      );

      const result = await client.list().withBranchIds(branchIds).execute();

      expect(result.branches).toHaveLength(2);
    });

    it('should handle empty branch list', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_branches/list`, () => {
          return HttpResponse.json({ branches: [] });
        }),
      );

      const result = await client.list().withProject('empty-project').execute();

      expect(result.branches).toHaveLength(0);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_branches/list`, () => {
          return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
        }),
      );

      await expect(client.list().withProject('non-existent').execute()).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a branch', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/delete`, async ({ request }) => {
          const body = await request.formData();
          expect(body.get('project')).toBe('my-project');
          expect(body.get('branch')).toBe('feature-branch');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(
        client.delete({
          project: 'my-project',
          branch: 'feature-branch',
        }),
      ).resolves.not.toThrow();
    });

    it('should handle deletion of main branch error', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/delete`, async () => {
          return HttpResponse.json({ error: 'Cannot delete main branch' }, { status: 400 });
        }),
      );

      await expect(
        client.delete({
          project: 'my-project',
          branch: 'main',
        }),
      ).rejects.toThrow();
    });

    it('should handle unauthorized deletion', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/delete`, () => {
          return HttpResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
        }),
      );

      await expect(
        client.delete({
          project: 'my-project',
          branch: 'feature-branch',
        }),
      ).rejects.toThrow();
    });
  });

  describe('rename', () => {
    it('should rename the main branch', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/rename`, async ({ request }) => {
          const body = await request.formData();
          expect(body.get('project')).toBe('my-project');
          expect(body.get('name')).toBe('main');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(
        client.rename({
          project: 'my-project',
          name: 'main',
        }),
      ).resolves.not.toThrow();
    });

    it('should handle rename conflicts', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/rename`, async () => {
          return HttpResponse.json({ error: 'Branch name already exists' }, { status: 400 });
        }),
      );

      await expect(
        client.rename({
          project: 'my-project',
          name: 'existing-branch',
        }),
      ).rejects.toThrow();
    });

    it('should handle unauthorized rename', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/rename`, () => {
          return HttpResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
        }),
      );

      await expect(
        client.rename({
          project: 'my-project',
          name: 'new-main',
        }),
      ).rejects.toThrow();
    });

    it('should handle invalid branch name', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_branches/rename`, async ({ request }) => {
          const body = await request.formData();
          const name = body.get('name') as string;
          if (name.length > 255) {
            return HttpResponse.json({ error: 'Branch name too long' }, { status: 400 });
          }
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const longName = 'a'.repeat(256);
      await expect(
        client.rename({
          project: 'my-project',
          name: longName,
        }),
      ).rejects.toThrow();
    });
  });
});
