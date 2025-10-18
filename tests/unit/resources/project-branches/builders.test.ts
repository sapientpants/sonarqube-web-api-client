// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProjectBranchesListBuilder } from '../../../../src/resources/project-branches/builders';
import {
  type Branch,
  ProjectBranchType,
  QualityGateStatus,
} from '../../../../src/resources/project-branches/types';

describe('Project Branches Builders', () => {
  const mockRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProjectBranchesListBuilder', () => {
    const mockBranches: Branch[] = [
      {
        name: 'main',
        type: ProjectBranchType.Branch,
        isMain: true,
        branchId: 'uuid-main',
        analysisDate: '2023-01-01T00:00:00Z',
        qualityGateStatus: QualityGateStatus.OK,
      },
      {
        name: 'develop',
        type: ProjectBranchType.Branch,
        isMain: false,
        branchId: 'uuid-develop',
        analysisDate: '2023-01-02T00:00:00Z',
        qualityGateStatus: QualityGateStatus.WARN,
      },
    ];

    it('should build request with project parameter', async () => {
      mockRequest.mockResolvedValue({ branches: mockBranches });

      const builder = new ProjectBranchesListBuilder(mockRequest);

      const result = await builder.withProject('my-project').execute();

      expect(mockRequest).toHaveBeenCalledWith({
        project: 'my-project',
      });
      expect(result.branches).toEqual(mockBranches);
    });

    it('should build request with branch IDs', async () => {
      const branchIds = ['uuid1', 'uuid2', 'uuid3'];
      mockRequest.mockResolvedValue({ branches: mockBranches });

      const builder = new ProjectBranchesListBuilder(mockRequest);

      const result = await builder.withBranchIds(branchIds).execute();

      expect(mockRequest).toHaveBeenCalledWith({
        branchIds,
      });
      expect(result.branches).toEqual(mockBranches);
    });

    it('should build request with both project and branch IDs', async () => {
      const branchIds = ['uuid1', 'uuid2'];
      mockRequest.mockResolvedValue({ branches: mockBranches });

      const builder = new ProjectBranchesListBuilder(mockRequest);

      const result = await builder.withProject('my-project').withBranchIds(branchIds).execute();

      expect(mockRequest).toHaveBeenCalledWith({
        project: 'my-project',
        branchIds,
      });
      expect(result.branches).toEqual(mockBranches);
    });

    it('should handle empty response', async () => {
      mockRequest.mockResolvedValue({ branches: [] });

      const builder = new ProjectBranchesListBuilder(mockRequest);

      const result = await builder.withProject('empty-project').execute();

      expect(result.branches).toEqual([]);
    });

    it('should validate branch IDs limit', async () => {
      // Create array with 51 branch IDs (exceeds limit of 50)
      const tooManyBranchIds = Array.from({ length: 51 }, (_, i) => `uuid${i.toString()}`);
      mockRequest.mockRejectedValue(new Error('Too many branch IDs'));

      const builder = new ProjectBranchesListBuilder(mockRequest);

      await expect(builder.withBranchIds(tooManyBranchIds).execute()).rejects.toThrow();
    });

    it('should work with authentication token', async () => {
      const authenticatedRequest = vi.fn().mockResolvedValue({ branches: mockBranches });

      const builder = new ProjectBranchesListBuilder(authenticatedRequest);
      await builder.withProject('secure-project').execute();

      expect(authenticatedRequest).toHaveBeenCalledWith({
        project: 'secure-project',
      });
    });
  });
});
