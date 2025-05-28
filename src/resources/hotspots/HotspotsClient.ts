import { BaseClient } from '../../core/BaseClient';
import { SearchHotspotsBuilder } from './builders';
import type {
  SearchHotspotsRequest,
  SearchHotspotsResponse,
  ShowHotspotRequest,
  ShowHotspotResponse,
  ChangeHotspotStatusRequest,
  ChangeHotspotStatusResponse,
} from './types';

/**
 * Client for managing SonarQube Security Hotspots
 */
export class HotspotsClient extends BaseClient {
  /**
   * Search for Security Hotspots with advanced filtering and pagination support
   * @returns Builder for constructing complex search queries
   * @requires Browse permission on the specified project(s)
   */
  search(): SearchHotspotsBuilder {
    return new SearchHotspotsBuilder(async (params: SearchHotspotsRequest) =>
      this.searchExecutor(params)
    );
  }

  /**
   * Get details of a specific Security Hotspot
   * @param params - Request parameters
   * @returns Detailed information about the Security Hotspot
   * @throws {Error} If the request fails
   * @requires Browse permission on the project
   */
  async show(params: ShowHotspotRequest): Promise<ShowHotspotResponse> {
    const urlParams = new URLSearchParams();
    urlParams.append('hotspot', params.hotspot);

    return this.request<ShowHotspotResponse>(`/api/hotspots/show?${urlParams.toString()}`);
  }

  /**
   * Change the status of a Security Hotspot
   * @param params - Request parameters
   * @returns Empty response on success
   * @throws {Error} If the request fails
   * @requires Administer Security Hotspot permission
   */
  async changeStatus(params: ChangeHotspotStatusRequest): Promise<ChangeHotspotStatusResponse> {
    return this.request<ChangeHotspotStatusResponse>('/api/hotspots/change_status', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Private method to execute search requests with proper parameter handling
   */
  private async searchExecutor(params: SearchHotspotsRequest): Promise<SearchHotspotsResponse> {
    const urlParams = new URLSearchParams();

    if (params.projectKey !== undefined && params.projectKey !== '') {
      urlParams.append('projectKey', params.projectKey);
    }

    if (params.hotspots !== undefined && params.hotspots.length > 0) {
      urlParams.append('hotspots', params.hotspots.join(','));
    }

    if (params.status !== undefined) {
      urlParams.append('status', params.status);
    }

    if (params.resolution !== undefined) {
      urlParams.append('resolution', params.resolution);
    }

    if (params.onlyMine !== undefined) {
      urlParams.append('onlyMine', params.onlyMine.toString());
    }

    if (params.sinceLeakPeriod !== undefined) {
      urlParams.append('sinceLeakPeriod', params.sinceLeakPeriod.toString());
    }

    if (params.files !== undefined && params.files.length > 0) {
      urlParams.append('files', params.files.join(','));
    }

    if (params.fileUuids !== undefined && params.fileUuids.length > 0) {
      urlParams.append('fileUuids', params.fileUuids.join(','));
    }

    if (params.p !== undefined && params.p > 0) {
      urlParams.append('p', params.p.toString());
    }

    if (params.ps !== undefined && params.ps > 0) {
      urlParams.append('ps', params.ps.toString());
    }

    return this.request<SearchHotspotsResponse>(`/api/hotspots/search?${urlParams.toString()}`);
  }
}
