/**
 * Types for the SonarQube Favorites API
 */

import type { PaginatedRequest, PaginatedResponse } from '../../core/builders';
import type { Component } from '../components/types';

/**
 * A favorite component
 */
export type Favorite = Component;

/**
 * Request parameters for add
 * @since 6.3
 */
export interface AddFavoriteRequest {
  /** Component key. Only components with qualifier TRK are supported */
  component: string;
}

/**
 * Request parameters for remove
 * @since 6.3
 */
export interface RemoveFavoriteRequest {
  /** Component key */
  component: string;
}

/**
 * Request parameters for search
 * @since 6.3
 */
export interface SearchFavoritesRequest extends PaginatedRequest {
  /** 1-based page number */
  p?: number;
  /** Page size. Must be greater than 0 and less or equal than 500 */
  ps?: number;
}

/**
 * Response from search
 */
export interface SearchFavoritesResponse extends PaginatedResponse {
  /** User's favorite components */
  favorites: Favorite[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}
