import { BaseClient } from '../../core/BaseClient';
import { SearchFavoritesBuilder } from './builders';
import type { AddFavoriteRequest, Favorite, RemoveFavoriteRequest } from './types';

/**
 * Client for interacting with the SonarQube Favorites API.
 * Provides methods for managing user favorites.
 */
export class FavoritesClient extends BaseClient {
  /**
   * Add a project as favorite for the authenticated user.
   * Only 100 components can be added as favorite.
   * Requires authentication and the following permission: 'Browse' on the project.
   *
   * @since 6.3
   * @param params - The add favorite parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Browse' permission on the project
   * @throws {ValidationError} If more than 100 favorites would be created
   * @throws {NotFoundError} If the component doesn't exist
   *
   * @example
   * ```typescript
   * await client.favorites.add({
   *   component: 'my-project'
   * });
   * ```
   */
  async add(params: AddFavoriteRequest): Promise<void> {
    await this.request('/api/favorites/add', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Remove a component (project, directory, file etc.) as favorite for the authenticated user.
   * Requires authentication.
   *
   * @since 6.3
   * @param params - The remove favorite parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the component doesn't exist or is not a favorite
   *
   * @example
   * ```typescript
   * await client.favorites.remove({
   *   component: 'my-project'
   * });
   * ```
   */
  async remove(params: RemoveFavoriteRequest): Promise<void> {
    await this.request('/api/favorites/remove', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search for the authenticated user favorites.
   * Requires authentication.
   *
   * @since 6.3
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   *
   * @example
   * ```typescript
   * // Get first page of favorites
   * const results = await client.favorites.search()
   *   .pageSize(50)
   *   .execute();
   *
   * // Iterate through all favorites
   * for await (const favorite of client.favorites.searchAll()) {
   *   console.log(favorite.name);
   * }
   * ```
   */
  search(): SearchFavoritesBuilder {
    return new SearchFavoritesBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      const queryString = query.toString();
      const url = queryString ? `/api/favorites/search?${queryString}` : '/api/favorites/search';
      return this.request(url);
    });
  }

  /**
   * Convenience method to iterate through all favorites.
   * This is equivalent to calling search().all()
   *
   * @returns An async iterator for all favorites
   *
   * @example
   * ```typescript
   * for await (const favorite of client.favorites.searchAll()) {
   *   console.log(favorite.name);
   * }
   * ```
   */
  searchAll(): AsyncIterableIterator<Favorite> {
    return this.search().all();
  }
}
