/**
 * Plugins API module
 *
 * This module provides functionality for managing SonarQube plugins,
 * including installing, uninstalling, updating, and listing plugins.
 *
 * **Note**: Most operations require 'Administer System' permission
 *
 * @since SonarQube 5.2
 * @module plugins
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // List available plugins
 * const available = await client.plugins.getAvailable();
 * console.log(`${available.plugins.length} plugins available for installation`);
 *
 * // Install a plugin
 * await client.plugins.install({ key: 'java' });
 *
 * // Check installation status
 * const pending = await client.plugins.getPending();
 * console.log(`${pending.installing.length} plugins being installed`);
 *
 * // List installed plugins
 * const installed = await client.plugins.getInstalled();
 * console.log(`${installed.plugins.length} plugins currently installed`);
 *
 * // Check for updates
 * const updates = await client.plugins.getUpdates();
 * console.log(`${updates.plugins.length} plugins have updates available`);
 * ```
 */

// Export the client
export { PluginsClient } from './PluginsClient.js';

// Export all types
export type {
  PluginUpdateStatus,
  Plugin,
  AvailablePlugin,
  InstalledPlugin,
  PendingPlugin,
  PluginUpdate,
  GetAvailablePluginsRequest,
  GetAvailablePluginsResponse,
  InstallPluginRequest,
  GetInstalledPluginsRequest,
  GetInstalledPluginsResponse,
  GetPendingPluginsResponse,
  UninstallPluginRequest,
  UpdatePluginRequest,
  GetPluginUpdatesResponse,
} from './types.js';
