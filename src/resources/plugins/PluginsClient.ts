import { BaseClient } from '../../core/BaseClient.js';
import type {
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

/**
 * Client for managing SonarQube plugins
 *
 * **Note**: Most operations require 'Administer System' permission.
 * Plugin management includes installing, uninstalling, and upgrading plugins.
 *
 * @since SonarQube 5.2
 */
export class PluginsClient extends BaseClient {
  /**
   * Get the list of all plugins available for installation.
   * Plugin information is retrieved from Update Center.
   * Requires 'Administer System' permission.
   *
   * @param request - Search parameters
   * @returns Promise that resolves to available plugins list
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * // Get all available plugins
   * const available = await client.plugins.getAvailable();
   *
   * // Search for specific plugins
   * const searchResults = await client.plugins.getAvailable({
   *   q: 'java'
   * });
   *
   * console.log(`Found ${available.plugins.length} available plugins`);
   * console.log(`Update center last refreshed: ${available.updateCenterRefresh}`);
   * ```
   */
  async getAvailable(
    request: GetAvailablePluginsRequest = {},
  ): Promise<GetAvailablePluginsResponse> {
    const params = new URLSearchParams();

    if (request.q !== undefined) {
      params.append('q', request.q);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/plugins/available?${queryString}` : '/api/plugins/available';

    return this.request<GetAvailablePluginsResponse>(url);
  }

  /**
   * Cancel any operation pending on any plugin (install, update or uninstall).
   * Requires 'Administer System' permission.
   *
   * @returns Promise that resolves when operations are cancelled
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * // Cancel all pending plugin operations
   * await client.plugins.cancelAll();
   * console.log('All pending plugin operations cancelled');
   * ```
   */
  async cancelAll(): Promise<void> {
    await this.request('/api/plugins/cancel_all', { method: 'POST' });
  }

  /**
   * Install the latest version of a plugin specified by its key.
   * Plugin information is retrieved from Update Center.
   * Requires 'Administer System' permission.
   *
   * @param request - Install parameters
   * @returns Promise that resolves when installation is initiated
   * @throws {AuthorizationError} If user lacks system administration permission
   * @throws {ApiError} If plugin risk consent has not been accepted or on commercial editions
   *
   * @example
   * ```typescript
   * // Install a plugin by key
   * await client.plugins.install({ key: 'java' });
   * console.log('Plugin installation initiated');
   *
   * // Check pending operations to see status
   * const pending = await client.plugins.getPending();
   * ```
   */
  async install(request: InstallPluginRequest): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('key', request.key);

    const headers = new Headers();
    headers.set('content-type', 'application/x-www-form-urlencoded');

    await this.request('/api/plugins/install', {
      method: 'POST',
      headers,
      body: formData.toString(),
    });
  }

  /**
   * Get the list of all plugins installed on the SonarQube instance.
   * Requires authentication.
   *
   * @param request - Request parameters
   * @returns Promise that resolves to installed plugins list
   *
   * @example
   * ```typescript
   * // Get all installed plugins
   * const installed = await client.plugins.getInstalled();
   *
   * // Get installed plugins with additional fields
   * const detailed = await client.plugins.getInstalled({
   *   f: ['category', 'license']
   * });
   *
   * console.log(`${installed.plugins.length} plugins installed`);
   * installed.plugins.forEach(plugin => {
   *   console.log(`${plugin.name} v${plugin.version}`);
   * });
   * ```
   */
  async getInstalled(
    request: GetInstalledPluginsRequest = {},
  ): Promise<GetInstalledPluginsResponse> {
    const params = new URLSearchParams();

    if (request.f !== undefined && request.f.length > 0) {
      params.append('f', request.f.join(','));
    }

    const queryString = params.toString();
    const url = queryString ? `/api/plugins/installed?${queryString}` : '/api/plugins/installed';

    return this.request<GetInstalledPluginsResponse>(url);
  }

  /**
   * Get the list of plugins which will either be installed or removed at the next startup.
   * Requires 'Administer System' permission.
   *
   * @returns Promise that resolves to pending plugins operations
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * const pending = await client.plugins.getPending();
   *
   * console.log(`${pending.installing.length} plugins pending installation`);
   * console.log(`${pending.updating.length} plugins pending update`);
   * console.log(`${pending.removing.length} plugins pending removal`);
   *
   * // List pending installations
   * pending.installing.forEach(plugin => {
   *   console.log(`Installing: ${plugin.name} v${plugin.version}`);
   * });
   * ```
   */
  async getPending(): Promise<GetPendingPluginsResponse> {
    return this.request<GetPendingPluginsResponse>('/api/plugins/pending');
  }

  /**
   * Uninstall the plugin specified by its key.
   * Requires 'Administer System' permission.
   *
   * @param request - Uninstall parameters
   * @returns Promise that resolves when uninstallation is initiated
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * // Uninstall a plugin by key
   * await client.plugins.uninstall({ key: 'java' });
   * console.log('Plugin uninstallation initiated');
   *
   * // Check pending operations to see status
   * const pending = await client.plugins.getPending();
   * ```
   */
  async uninstall(request: UninstallPluginRequest): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('key', request.key);

    const headers = new Headers();
    headers.set('content-type', 'application/x-www-form-urlencoded');

    await this.request('/api/plugins/uninstall', {
      method: 'POST',
      headers,
      body: formData.toString(),
    });
  }

  /**
   * Update a plugin specified by its key to the latest compatible version.
   * Plugin information is retrieved from Update Center.
   * Requires 'Administer System' permission.
   *
   * @param request - Update parameters
   * @returns Promise that resolves when update is initiated
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * // Update a plugin by key
   * await client.plugins.update({ key: 'java' });
   * console.log('Plugin update initiated');
   *
   * // Check pending operations to see status
   * const pending = await client.plugins.getPending();
   * ```
   */
  async update(request: UpdatePluginRequest): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('key', request.key);

    const headers = new Headers();
    headers.set('content-type', 'application/x-www-form-urlencoded');

    await this.request('/api/plugins/update', {
      method: 'POST',
      headers,
      body: formData.toString(),
    });
  }

  /**
   * List plugins installed on the SonarQube instance for which newer versions are available.
   * Plugin information is retrieved from Update Center.
   * Requires 'Administer System' permission.
   *
   * @returns Promise that resolves to plugins with available updates
   * @throws {AuthorizationError} If user lacks system administration permission
   *
   * @example
   * ```typescript
   * const updates = await client.plugins.getUpdates();
   *
   * console.log(`${updates.plugins.length} plugins have updates available`);
   * console.log(`Update center last refreshed: ${updates.updateCenterRefresh}`);
   *
   * updates.plugins.forEach(plugin => {
   *   console.log(`${plugin.name}: ${plugin.version} -> ${plugin.updates[0]?.version}`);
   * });
   * ```
   */
  async getUpdates(): Promise<GetPluginUpdatesResponse> {
    return this.request<GetPluginUpdatesResponse>('/api/plugins/updates');
  }
}
