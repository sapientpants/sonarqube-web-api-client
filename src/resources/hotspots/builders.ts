import { PaginatedBuilder } from '../../core/builders';
import type {
  SearchHotspotsRequest,
  SearchHotspotsResponse,
  Hotspot,
  HotspotStatus,
  HotspotResolution,
} from './types';

/**
 * Builder for constructing complex Security Hotspot search queries
 */
export class SearchHotspotsBuilder extends PaginatedBuilder<
  SearchHotspotsRequest,
  SearchHotspotsResponse,
  Hotspot
> {
  /**
   * Filter by project key
   * @param projectKey - Key of the project to filter on
   */
  forProject(projectKey: string): this {
    return this.setParam('projectKey', projectKey);
  }

  /**
   * Filter by project key (alias for forProject)
   * @param projectKey - Key of the project to filter on
   */
  projectKey(projectKey: string): this {
    return this.forProject(projectKey);
  }

  /**
   * Filter by specific Security Hotspot keys
   * @param hotspotKeys - Array of Security Hotspot keys
   */
  withHotspots(hotspotKeys: string[]): this {
    return this.setParam('hotspots', hotspotKeys);
  }

  /**
   * Filter by Security Hotspot status
   * @param status - The status to filter by
   */
  withStatus(status: HotspotStatus): this {
    return this.setParam('status', status);
  }

  /**
   * Filter by Security Hotspot status (alias for withStatus)
   * @param status - The status to filter by
   */
  status(status: HotspotStatus): this {
    return this.withStatus(status);
  }

  /**
   * Filter by Security Hotspot resolution (only applies when status is REVIEWED)
   * @param resolution - The resolution to filter by
   */
  withResolution(resolution: HotspotResolution): this {
    return this.setParam('resolution', resolution);
  }

  /**
   * Filter by Security Hotspot resolution (alias for withResolution)
   * @param resolution - The resolution to filter by
   */
  resolution(resolution: HotspotResolution): this {
    return this.withResolution(resolution);
  }

  /**
   * Return only Security Hotspots assigned to the current user
   * @param onlyMine - Whether to return only current user's hotspots
   */
  onlyMine(onlyMine = true): this {
    return this.setParam('onlyMine', onlyMine);
  }

  /**
   * Return only Security Hotspots created since the leak period
   * @param sinceLeakPeriod - Whether to filter by leak period
   */
  sinceLeakPeriod(sinceLeakPeriod = true): this {
    return this.setParam('sinceLeakPeriod', sinceLeakPeriod);
  }

  /**
   * Filter by specific file paths
   * @param filePaths - Array of file paths to filter by
   */
  inFiles(filePaths: string[]): this {
    return this.setParam('files', filePaths);
  }

  /**
   * Filter by specific file paths (alias for inFiles)
   * @param filePaths - Array of file paths to filter by
   */
  files(filePaths: string[]): this {
    return this.inFiles(filePaths);
  }

  /**
   * Filter by specific file UUIDs
   * @param fileUuids - Array of file UUIDs to filter by
   */
  inFileUuids(fileUuids: string[]): this {
    return this.setParam('fileUuids', fileUuids);
  }

  /**
   * Convenience method to filter for hotspots that need review
   */
  needingReview(): this {
    return this.withStatus('TO_REVIEW');
  }

  /**
   * Convenience method to filter for reviewed hotspots
   */
  reviewed(): this {
    return this.withStatus('REVIEWED');
  }

  /**
   * Convenience method to filter for fixed hotspots
   */
  fixed(): this {
    return this.withStatus('REVIEWED').withResolution('FIXED');
  }

  /**
   * Convenience method to filter for safe hotspots
   */
  safe(): this {
    return this.withStatus('REVIEWED').withResolution('SAFE');
  }

  /**
   * Execute the search operation
   */
  async execute(): Promise<SearchHotspotsResponse> {
    return this.executor(this.params as SearchHotspotsRequest);
  }

  /**
   * Extract hotspots items from the paginated response
   */
  protected getItems(response: SearchHotspotsResponse): Hotspot[] {
    return response.hotspots;
  }
}
