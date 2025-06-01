/**
 * Server API module
 *
 * This module provides basic server information functionality.
 *
 * **Note**: This API is minimal and only provides version information.
 * For comprehensive server management, use the SystemClient instead.
 *
 * @since SonarQube 2.10
 * @module server
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Get server version
 * const version = await client.server.version();
 * console.log(`SonarQube version: ${version}`);
 * ```
 */

// Export the client
export { ServerClient } from './ServerClient';

// Export all types
export type { ServerVersionResponse } from './types';
