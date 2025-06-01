/**
 * Types for SonarQube Plugins API
 *
 * **Note**: Requires 'Administer System' permission for most operations
 * @since SonarQube 5.2
 */

/**
 * Plugin update status values
 */
export type PluginUpdateStatus =
  | 'COMPATIBLE'
  | 'INCOMPATIBLE'
  | 'REQUIRES_SYSTEM_UPGRADE'
  | 'DEPS_REQUIRE_SYSTEM_UPGRADE'
  | 'REQUIRES_UPGRADE'
  | 'DEPS_REQUIRE_UPGRADE';

/**
 * Plugin information
 */
export interface Plugin {
  /** Plugin key */
  key: string;
  /** Plugin name */
  name: string;
  /** Plugin description */
  description?: string;
  /** Plugin version */
  version: string;
  /** Plugin license */
  license?: string;
  /** Organization name */
  organizationName?: string;
  /** Organization URL */
  organizationUrl?: string;
  /** Plugin homepage URL */
  homepageUrl?: string;
  /** Issue tracker URL */
  issueTrackerUrl?: string;
  /** Plugin filename */
  filename?: string;
  /** File hash */
  hash?: string;
  /** Plugin implementation build */
  implementationBuild?: string;
  /** Date the plugin was last updated */
  updatedAt?: string;
  /** Plugin category */
  category?: string;
  /** Child first class loader */
  childFirstClassLoader?: boolean;
  /** Base plugin key */
  basePlugin?: string;
  /** Required plugins */
  requiredPlugins?: string[];
}

/**
 * Available plugin (for installation)
 */
export interface AvailablePlugin extends Plugin {
  /** Update status */
  updateStatus: PluginUpdateStatus;
  /** Plugin release information */
  release?: {
    version: string;
    date: string;
    description?: string;
    changelogUrl?: string;
    downloadUrl?: string;
  };
  /** Plugin terms and conditions URL */
  termsAndConditionsUrl?: string;
}

/**
 * Installed plugin information
 */
export interface InstalledPlugin extends Plugin {
  /** Whether the plugin is default/core */
  defaultPlugin?: boolean;
  /** Plugin edition */
  edition?: string;
  /** Plugin SonarQube version requirement */
  sonarQubeMinVersion?: string;
}

/**
 * Pending plugin operation
 */
export interface PendingPlugin extends Plugin {
  /** Operation type */
  operation: 'INSTALL' | 'UPDATE' | 'UNINSTALL';
}

/**
 * Plugin update information
 */
export interface PluginUpdate extends Plugin {
  /** Available updates */
  updates: Array<{
    version: string;
    status: PluginUpdateStatus;
    release?: {
      version: string;
      date: string;
      description?: string;
      changelogUrl?: string;
    };
  }>;
}

/**
 * Request parameters for getting available plugins
 */
export interface GetAvailablePluginsRequest {
  /** Search query for plugin name or description */
  q?: string;
}

/**
 * Response from available plugins search
 */
export interface GetAvailablePluginsResponse {
  /** List of available plugins */
  plugins: AvailablePlugin[];
  /** Update center last refresh date */
  updateCenterRefresh: string;
}

/**
 * Request parameters for installing a plugin
 */
export interface InstallPluginRequest {
  /** Plugin key to install */
  key: string;
}

/**
 * Request parameters for getting installed plugins
 */
export interface GetInstalledPluginsRequest {
  /** Include additional fields */
  f?: string[];
}

/**
 * Response from installed plugins list
 */
export interface GetInstalledPluginsResponse {
  /** List of installed plugins */
  plugins: InstalledPlugin[];
}

/**
 * Response from pending plugins list
 */
export interface GetPendingPluginsResponse {
  /** Plugins pending installation */
  installing: PendingPlugin[];
  /** Plugins pending update */
  updating: PendingPlugin[];
  /** Plugins pending removal */
  removing: PendingPlugin[];
}

/**
 * Request parameters for uninstalling a plugin
 */
export interface UninstallPluginRequest {
  /** Plugin key to uninstall */
  key: string;
}

/**
 * Request parameters for updating a plugin
 */
export interface UpdatePluginRequest {
  /** Plugin key to update */
  key: string;
}

/**
 * Response from plugin updates list
 */
export interface GetPluginUpdatesResponse {
  /** List of plugins with available updates */
  plugins: PluginUpdate[];
  /** Update center last refresh date */
  updateCenterRefresh: string;
}
