import { BaseClient } from '../../core/BaseClient';
import { DeprecatedClass } from '../../core/deprecation';
import { SonarQubeError } from '../../errors';
import type { UserPropertiesResponse } from './types';

/**
 * Client for the deprecated User Properties API
 *
 * @deprecated The user_properties API was removed in SonarQube 6.3.
 * Use the favorites and notifications APIs instead:
 * - For favorites: Use `client.favorites`
 * - For notifications: Use `client.notifications`
 *
 * @example Migration from user_properties to favorites:
 * ```typescript
 * // Before (user_properties):
 * const properties = await client.userProperties.index();
 *
 * // After (favorites):
 * const favorites = await client.favorites.search();
 * ```
 *
 * @example Migration from user_properties to notifications:
 * ```typescript
 * // Before (user_properties):
 * const properties = await client.userProperties.index();
 *
 * // After (notifications):
 * const notifications = await client.notifications.list();
 * ```
 */
@DeprecatedClass({
  reason: 'The user_properties API was removed in SonarQube 6.3',
  replacement: 'favorites and notifications APIs',
  deprecatedSince: '6.3',
  removalDate: '2017-06-05', // SonarQube 6.3 release date
  migrationGuide: `The user_properties API has been split into two separate APIs:
  
1. **Favorites API** - For managing favorite projects/components:
   - Use \`client.favorites.add()\` to add a favorite
   - Use \`client.favorites.remove()\` to remove a favorite
   - Use \`client.favorites.search()\` to list favorites

2. **Notifications API** - For managing notification preferences:
   - Use \`client.notifications.add()\` to add a notification
   - Use \`client.notifications.remove()\` to remove a notification
   - Use \`client.notifications.list()\` to list notifications

Note: The old user_properties API combined both favorites and notifications into a single endpoint. 
You now need to use the appropriate API based on your use case.`,
  examples: [
    {
      before: `const properties = await client.userProperties.index();`,
      after: `// For favorites:
const favorites = await client.favorites.search();

// For notifications:
const notifications = await client.notifications.list();`,
      description:
        'Split your user_properties calls into favorites or notifications based on the property type',
    },
  ],
})
export class UserPropertiesClient extends BaseClient {
  /**
   * Get user properties (removed endpoint)
   *
   * @deprecated This endpoint was removed in SonarQube 6.3. Use favorites.search() or notifications.list() instead.
   * @throws {SonarQubeError} Always throws an error indicating the API was removed
   *
   * @example
   * ```typescript
   * // This will throw an error:
   * try {
   *   await client.userProperties.index();
   * } catch (error) {
   *   // Error will guide you to use favorites or notifications APIs
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-deprecated
  async index(): Promise<UserPropertiesResponse> {
    throw new SonarQubeError(
      'The user_properties API was removed in SonarQube 6.3. ' +
        'Please use the favorites API (client.favorites) for managing favorite projects, ' +
        'or the notifications API (client.notifications) for managing notification preferences.',
      'API_REMOVED',
      410, // Gone status code
      {
        error: 'api_removed',
        message: 'This API endpoint has been removed',
        migration: {
          favorites: 'Use client.favorites for managing favorite projects',
          notifications: 'Use client.notifications for managing notification preferences',
        },
      }
    );
  }
}
