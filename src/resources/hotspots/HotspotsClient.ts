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
    const urlParams = this.buildSearchParams(params);
    return this.request<SearchHotspotsResponse>(`/api/hotspots/search?${urlParams.toString()}`);
  }

  /**
   * Builds URL parameters for hotspots search
   * @private
   */
  private buildSearchParams(params: SearchHotspotsRequest): URLSearchParams {
    const urlParams = new URLSearchParams();

    this.appendNonEmptyStringParam(urlParams, 'projectKey', params.projectKey);
    this.appendNonEmptyStringParam(urlParams, 'status', params.status);
    this.appendNonEmptyStringParam(urlParams, 'resolution', params.resolution);

    this.appendArrayParam(urlParams, 'hotspots', params.hotspots);
    this.appendArrayParam(urlParams, 'files', params.files);
    this.appendArrayParam(urlParams, 'fileUuids', params.fileUuids);

    this.appendBooleanParam(urlParams, 'onlyMine', params.onlyMine);
    this.appendBooleanParam(urlParams, 'sinceLeakPeriod', params.sinceLeakPeriod);

    this.appendPositiveNumberParam(urlParams, 'p', params.p);
    this.appendPositiveNumberParam(urlParams, 'ps', params.ps);

    return urlParams;
  }

  /**
   * Appends non-empty string parameter to URLSearchParams
   * @private
   */
  private appendNonEmptyStringParam(
    params: URLSearchParams,
    key: string,
    value: string | undefined
  ): void {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  }

  /**
   * Appends array parameter to URLSearchParams as comma-separated string
   * @private
   */
  private appendArrayParam(
    params: URLSearchParams,
    key: string,
    value: string[] | undefined
  ): void {
    if (value !== undefined && value.length > 0) {
      params.append(key, value.join(','));
    }
  }

  /**
   * Appends boolean parameter to URLSearchParams
   * @private
   */
  private appendBooleanParam(
    params: URLSearchParams,
    key: string,
    value: boolean | undefined
  ): void {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  }

  /**
   * Appends positive number parameter to URLSearchParams
   * @private
   */
  private appendPositiveNumberParam(
    params: URLSearchParams,
    key: string,
    value: number | undefined
  ): void {
    if (value !== undefined && value > 0) {
      params.append(key, value.toString());
    }
  }
}
