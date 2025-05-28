/**
 * Hotspots API types
 */

import type { PaginatedRequest, PaginatedResponse } from '../../core/builders';

/**
 * Security Hotspot status values
 */
export type HotspotStatus = 'TO_REVIEW' | 'REVIEWED';

/**
 * Security Hotspot resolution values
 */
export type HotspotResolution = 'FIXED' | 'SAFE';

/**
 * Text range within a file
 */
export interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Rule information for a Security Hotspot
 */
export interface HotspotRule {
  key: string;
  name: string;
  securityCategory: string;
  vulnerabilityProbability: string;
}

/**
 * Security Hotspot entity
 */
export interface Hotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: HotspotStatus;
  resolution?: HotspotResolution;
  line?: number;
  hash?: string;
  message: string;
  assignee?: string;
  author?: string;
  creationDate: string;
  updateDate: string;
  textRange?: TextRange;
  flows?: Array<{
    locations: Array<{
      component: string;
      textRange?: TextRange;
      msg?: string;
    }>;
  }>;
  rule?: HotspotRule;
}

/**
 * Search hotspots request parameters
 */
export interface SearchHotspotsRequest extends PaginatedRequest {
  projectKey?: string;
  hotspots?: string[];
  status?: HotspotStatus;
  resolution?: HotspotResolution;
  onlyMine?: boolean;
  sinceLeakPeriod?: boolean;
  files?: string[];
  fileUuids?: string[];
}

/**
 * Search hotspots response
 */
export interface SearchHotspotsResponse extends PaginatedResponse {
  hotspots: Hotspot[];
  components?: Array<{
    key: string;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
}

/**
 * Show hotspot request parameters
 */
export interface ShowHotspotRequest {
  hotspot: string;
}

/**
 * Show hotspot response
 */
export interface ShowHotspotResponse {
  key: string;
  component: {
    key: string;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  };
  project: {
    key: string;
    name: string;
    longName: string;
  };
  rule: {
    key: string;
    name: string;
    securityCategory: string;
    vulnerabilityProbability: string;
    riskDescription?: string;
    vulnerabilityDescription?: string;
    fixRecommendations?: string;
  };
  status: HotspotStatus;
  resolution?: HotspotResolution;
  line?: number;
  hash?: string;
  message: string;
  messageFormattings?: Array<{
    start: number;
    end: number;
    type: string;
  }>;
  assignee?: {
    login: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  author?: {
    login: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  creationDate: string;
  updateDate: string;
  comment?: Array<{
    key: string;
    login: string;
    htmlText: string;
    markdown: string;
    updatable: boolean;
    createdAt: string;
    updatedAt?: string;
  }>;
  changelog?: Array<{
    user: {
      login: string;
      name: string;
      avatar?: string;
    };
    creationDate: string;
    diffs: Array<{
      key: string;
      newValue?: string;
      oldValue?: string;
    }>;
  }>;
  textRange?: TextRange;
  flows?: Array<{
    locations: Array<{
      component: string;
      textRange?: TextRange;
      msg?: string;
      msgFormattings?: Array<{
        start: number;
        end: number;
        type: string;
      }>;
    }>;
  }>;
}

/**
 * Change hotspot status request parameters
 */
export interface ChangeHotspotStatusRequest {
  hotspot: string;
  status: HotspotStatus;
  resolution?: HotspotResolution;
  comment?: string;
}

/**
 * Change hotspot status response
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ChangeHotspotStatusResponse {
  // The API returns empty response on success
}
