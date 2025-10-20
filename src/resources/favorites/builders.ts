import { PaginatedBuilder } from '../../core/builders/index.js';
import type { Favorite, SearchFavoritesRequest, SearchFavoritesResponse } from './types.js';

/**
 * Builder for searching favorites
 * @since 6.3
 */
export class SearchFavoritesBuilder extends PaginatedBuilder<
  SearchFavoritesRequest,
  SearchFavoritesResponse,
  Favorite
> {
  /**
   * Execute the search request
   */
  async execute(): Promise<SearchFavoritesResponse> {
    return this.executor(this.params as SearchFavoritesRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchFavoritesResponse): Favorite[] {
    return response.favorites;
  }
}
