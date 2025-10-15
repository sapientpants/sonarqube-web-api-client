import { BaseClient } from '../../core/BaseClient';
import type { ShowDuplicationsRequest, ShowDuplicationsResponse } from './types';

/**
 * Client for interacting with duplication endpoints
 */
export class DuplicationsClient extends BaseClient {
  /**
   * Get duplications for a file
   *
   * Requires 'Browse' permission on file's project.
   *
   * @param params - Request parameters including file key
   * @returns Duplication information for the specified file
   *
   * @example
   * ```typescript
   * const client = new DuplicationsClient(baseUrl, token);
   *
   * // Get duplications for a file
   * const duplications = await client.show({
   *   key: 'my_project:/src/foo/Bar.php'
   * });
   *
   * console.log(`Found ${duplications.duplications.length} duplication sets`);
   * console.log(`Involving ${duplications.files.length} files`);
   *
   * // Get duplications for a file on a specific branch
   * const branchDuplications = await client.show({
   *   key: 'my_project:/src/foo/Bar.php',
   *   branch: 'feature/my_branch'
   * });
   * ```
   */
  async show(params: ShowDuplicationsRequest): Promise<ShowDuplicationsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('key', params.key);

    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }

    if (params.pullRequest !== undefined) {
      searchParams.append('pullRequest', params.pullRequest);
    }

    return this.request<ShowDuplicationsResponse>(
      `/api/duplications/show?${searchParams.toString()}`,
    );
  }
}
